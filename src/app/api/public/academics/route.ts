import { NextResponse, connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { academic_boards, academic_classes } from "@/db/schema/taxonomy";

export async function GET() {
  await connection();

  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const [classes, boards] = await Promise.all([
    db
      .select({
        id: academic_classes.id,
        name: academic_classes.name,
      })
      .from(academic_classes)
      .where(eq(academic_classes.is_active, true))
      .orderBy(asc(academic_classes.display_order), asc(academic_classes.name)),
    db
      .select({
        id: academic_boards.id,
        name: academic_boards.name,
      })
      .from(academic_boards)
      .where(eq(academic_boards.is_active, true))
      .orderBy(asc(academic_boards.name)),
  ]);

  return NextResponse.json({ classes, boards });
}

