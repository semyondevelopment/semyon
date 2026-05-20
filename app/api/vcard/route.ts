import { NextResponse, type NextRequest } from "next/server";
import { getContact, toVCard, parseMode } from "@/lib/contact";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mode = parseMode(req.nextUrl.searchParams.get("mode"));
  const c = getContact(mode);
  const body = toVCard(c);
  const filename = `${c.name.replace(/[^A-Za-z0-9._-]+/g, "_")}-${mode}.vcf`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=60",
    },
  });
}
