import CocktailDetail from "@/components/pages/CocktailDetail"

export default function CocktailDetailPage({ params }: { params: { id: string } }) {
  return <CocktailDetail id={params.id} />
}
