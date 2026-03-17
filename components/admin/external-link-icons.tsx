import type { ReactNode } from "react";

type ExternalLinkIconsProps = {
  notionUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
};

type ExternalLinkIconButtonProps = {
  href: string;
  label: string;
  children: ReactNode;
};

function ExternalLinkIconButton({
  href,
  label,
  children,
}: ExternalLinkIconButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="icon-link"
      aria-label={label}
      title={label}
    >
      {children}
    </a>
  );
}

export function ExternalLinkIcons({
  notionUrl,
  instagramUrl,
  linkedinUrl,
  websiteUrl,
}: ExternalLinkIconsProps) {
  if (!notionUrl && !instagramUrl && !linkedinUrl && !websiteUrl) {
    return <span className="role-placeholder">No links</span>;
  }

  return (
    <div className="icon-link-row">
      {notionUrl ? (
        <ExternalLinkIconButton href={notionUrl} label="Open Notion">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 4.5 15.7 3 20 6.1v14l-10.5 1.7L4 18.3v-12Zm2.4 2.2v9.9l1.9.7V9.1l6.3 9.5 2.2-.4V8.4l-1.8-.6v7.6L10 6.4l-2.6.3Z"
              fill="currentColor"
            />
          </svg>
        </ExternalLinkIconButton>
      ) : null}

      {instagramUrl ? (
        <ExternalLinkIconButton href={instagramUrl} label="Open Instagram">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm9.6 1.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
              fill="currentColor"
            />
          </svg>
        </ExternalLinkIconButton>
      ) : null}

      {linkedinUrl ? (
        <ExternalLinkIconButton href={linkedinUrl} label="Open LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5.4 8.2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM4 20V9.6h2.8V20H4Zm4.7 0V9.6h2.7v1.4h.1c.4-.8 1.4-1.7 2.9-1.7 3.1 0 3.6 2 3.6 4.7V20h-2.8v-5.4c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V20H8.7Z"
              fill="currentColor"
            />
          </svg>
        </ExternalLinkIconButton>
      ) : null}

      {websiteUrl ? (
        <ExternalLinkIconButton href={websiteUrl} label="Open website">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm5.9 8.2h-3.1a15.8 15.8 0 0 0-1-5.3 7.2 7.2 0 0 1 4.1 5.3ZM12 4.8c.8 1 1.6 3.3 1.9 6.4h-3.8c.3-3.1 1.1-5.4 1.9-6.4Zm-2 1.1a15.8 15.8 0 0 0-1 5.3H5.9A7.2 7.2 0 0 1 10 5.9ZM5.9 13H9c.1 1.9.5 3.7 1 5.3A7.2 7.2 0 0 1 5.9 13Zm6.1 6.2c-.8-1-1.6-3.3-1.9-6.4h3.8c-.3 3.1-1.1 5.4-1.9 6.4Zm1.8-.9c.5-1.6.9-3.4 1-5.3h3.1a7.2 7.2 0 0 1-4.1 5.3Z"
              fill="currentColor"
            />
          </svg>
        </ExternalLinkIconButton>
      ) : null}
    </div>
  );
}
