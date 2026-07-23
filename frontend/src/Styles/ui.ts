import styled, { css } from "styled-components";

/* ── Superfícies ───────────────────────────────────────────── */
export const Card = styled.div`
  background: linear-gradient(180deg, ${(p) => p.theme.cores.surface} 0%, ${(p) => p.theme.cores.surfaceAlt} 100%);
  border: 1px solid ${(p) => p.theme.cores.border};
  border-radius: 16px;
  box-shadow: ${(p) => p.theme.cores.shadow};
  padding: 22px;
`;

/* ── Cabeçalho de página ───────────────────────────────────── */
export const PageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0;
  background: linear-gradient(120deg, ${(p) => p.theme.cores.primaryDark} 0%, ${(p) => p.theme.cores.primary} 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

export const PageSubtitle = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: ${(p) => p.theme.cores.textMuted};
`;

export const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 14px;
  color: ${(p) => p.theme.cores.text};
`;

export const Muted = styled.p`
  color: ${(p) => p.theme.cores.textMuted};
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
`;

/* ── Botões ────────────────────────────────────────────────── */
export const Button = styled.button<{ $variant?: "primary" | "ghost" | "danger"; $block?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  border-radius: 11px;
  padding: 10px 18px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: ${(p) => (p.$block ? "100%" : "auto")};

  ${(p) => {
    const c = p.theme.cores;
    switch (p.$variant) {
      case "ghost":
        return css`
          background: transparent;
          color: ${c.text};
          border-color: ${c.border};
          &:hover { background: ${c.surfaceAlt}; }
        `;
      case "danger":
        return css`
          background: linear-gradient(135deg, ${c.danger} 0%, ${c.danger} 100%);
          color: #fff;
          box-shadow: 0 6px 16px ${c.danger}3a;
          &:hover { filter: brightness(1.05); transform: translateY(-1px); }
          &:active { transform: translateY(0); }
        `;
      default:
        return css`
          background: linear-gradient(135deg, ${c.accent} 0%, ${c.primary} 55%, ${c.primaryDark} 100%);
          color: #fff;
          box-shadow: 0 6px 16px ${c.primary}3a;
          &:hover { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 8px 22px ${c.primary}4d; }
          &:active { transform: translateY(0); }
        `;
    }
  }}

  &:disabled { opacity: 0.55; cursor: not-allowed; filter: none; transform: none; box-shadow: none; }
`;

/* ── Formulário ────────────────────────────────────────────── */
export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
`;

export const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.cores.textMuted};
`;

export const TextInput = styled.input`
  font-size: 14px;
  padding: 11px 13px;
  border-radius: 11px;
  border: 1.5px solid ${(p) => p.theme.cores.border};
  background: ${(p) => p.theme.cores.surface};
  color: ${(p) => p.theme.cores.text};
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: ${(p) => p.theme.cores.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.cores.accentSoft};
  }
  &::placeholder { color: ${(p) => p.theme.cores.textMuted}; opacity: 0.7; }
`;

/* ── Tags / badges ─────────────────────────────────────────── */
export const Tag = styled.span<{ $tone?: "blue" | "green" | "orange" | "red" | "muted" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  ${(p) => {
    const c = p.theme.cores;
    switch (p.$tone) {
      case "green": return css`background: ${c.success}22; color: ${c.success};`;
      case "orange": return css`background: ${c.warn}22; color: ${c.warn};`;
      case "red": return css`background: ${c.danger}22; color: ${c.danger};`;
      case "muted": return css`background: ${c.border}; color: ${c.textMuted};`;
      default: return css`background: ${c.accentSoft}; color: ${c.primary};`;
    }
  }}
`;

/* ── KPIs ──────────────────────────────────────────────────── */
export const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 22px;
`;

export const KpiCard = styled(Card)<{ $cor?: string }>`
  padding: 18px 18px 16px;
  border-top: 3px solid ${(p) => p.$cor ?? p.theme.cores.accent};
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px ${(p) => (p.$cor ?? p.theme.cores.primary)}26;
  }
`;

export const KpiIcon = styled.span<{ $cor?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: ${(p) => (p.$cor ?? p.theme.cores.primary)}22;
  color: ${(p) => p.$cor ?? p.theme.cores.primary};
  margin-bottom: 12px;
`;

export const KpiValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: ${(p) => p.theme.cores.primaryDark};
`;

export const KpiLabel = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.cores.textMuted};
  margin-top: 6px;
`;

/* ── Estado vazio ──────────────────────────────────────────── */
export const EmptyState = styled(Card)`
  text-align: center;
  padding: 56px 28px;
`;

export const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;

/* ── Tabela ─────────────────────────────────────────────────── */
export const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.cores.border};
`;

export const Tabela = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

export const Th = styled.th`
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${(p) => p.theme.cores.textMuted};
  background: ${(p) => p.theme.cores.surfaceAlt};
  padding: 10px 14px;
  white-space: nowrap;
`;

export const Td = styled.td`
  padding: 10px 14px;
  border-top: 1px solid ${(p) => p.theme.cores.border};
  color: ${(p) => p.theme.cores.text};
`;

export const Banner = styled.div<{ $tone?: "info" | "warn" }>`
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.5;
  ${(p) => {
    const c = p.theme.cores;
    return p.$tone === "warn"
      ? css`background: ${c.warn}18; color: ${c.warn}; border: 1px solid ${c.warn}44;`
      : css`background: ${c.accentSoft}; color: ${c.primary}; border: 1px solid ${c.accent}44;`;
  }}
`;
