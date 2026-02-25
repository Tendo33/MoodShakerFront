import { NextRequest, NextResponse } from "next/server";
import { getCocktailById } from "@/lib/cocktail-data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing cocktail id" },
      { status: 400 },
    );
  }

  try {
    const cocktail = await getCocktailById(id);
    if (!cocktail) {
      return NextResponse.json(
        { success: false, error: "Cocktail not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: cocktail });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load cocktail";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
