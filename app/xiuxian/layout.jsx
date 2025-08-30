// app/xiuxian/layout.jsx  (Server Component)
import "./userinfo.css";   // 注意這裡是 ./ 而不是 ../
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function XiuxianLayout({ children }) {
  return children;
}
