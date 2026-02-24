import { NextResponse } from "next/server";
import { getCocktailById } from "@/lib/cocktail-data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

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
