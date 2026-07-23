import type { ReactNode } from "react";
import { Card, SectionTitle } from "../../Styles/ui.js";

export function ChartCard({
  titulo,
  altura = 240,
  children,
}: {
  titulo: string;
  altura?: number;
  children: ReactNode;
}) {
  return (
    <Card>
      <SectionTitle>{titulo}</SectionTitle>
      <div style={{ height: altura, position: "relative" }}>{children}</div>
    </Card>
  );
}
