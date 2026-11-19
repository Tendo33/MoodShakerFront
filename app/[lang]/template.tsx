/** Re-mounted on every navigation, so each page arrives with one short fade. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
