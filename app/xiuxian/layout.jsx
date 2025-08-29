// app/xiuxian/layout.jsx  (Server Component)

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function XiuxianLayout({ children }) {
  return children; // 不改結構，單純提供 segment config
}
