export function formatCurrency(cents: number, hideValues: boolean = false): string {
  if (hideValues) {
    return "••••••";
  }
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
