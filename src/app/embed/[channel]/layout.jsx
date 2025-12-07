export const metadata = {
  title: 'KracRadio Widget',
  description: 'Embedded KracRadio player widget',
};

export default function EmbedLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: 'transparent' }}>
        {children}
      </body>
    </html>
  );
}
