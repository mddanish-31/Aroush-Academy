import QRCode from "qrcode-svg";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { readFees } from "@/lib/finance/ledger";
import { isMoney, isUuid } from "@/lib/finance/rules";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return NextResponse.json({ ok: false }, { status: 404, headers });
    const actor = await getCurrentUser();
    if (!actor || (actor.role !== "academy-admin" && actor.role !== "student" && actor.role !== "parent")) return NextResponse.json({ ok: false }, { status: actor ? 403 : 401, headers });
    const id = request.nextUrl.searchParams.get("obligationId");
    const amount = Number(request.nextUrl.searchParams.get("amountPaise"));
    if (!isUuid(id) || !isMoney(amount)) return NextResponse.json({ ok: false }, { status: 400, headers });
    const studentId = request.nextUrl.searchParams.get("studentId");
    const page = Number(request.nextUrl.searchParams.get("page") ?? "0");
    const data = await readFees(actor, studentId, page);
    const obligation = data.obligations.find((item) => item.id === id);
    if (!obligation || !data.payee?.upiId || amount > obligation.balancePaise) return NextResponse.json({ ok: false }, { status: 404, headers });
    const params = new URLSearchParams({ pa: data.payee.upiId, pn: data.payee.name, am: (amount / 100).toFixed(2), cu: "INR" });
    const svg = new QRCode({ content: `upi://pay?${params}`, padding: 12, width: 256, height: 256, color: "#1D1D1F", background: "#FFFFFF", ecl: "M" }).svg();
    return new NextResponse(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8", "Content-Disposition": request.nextUrl.searchParams.has("download") ? 'attachment; filename="aroush-fee-qr.svg"' : 'inline; filename="aroush-fee-qr.svg"', "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 503, headers });
  }
}
