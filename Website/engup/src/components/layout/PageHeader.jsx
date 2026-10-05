export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="page-head__eyebrow">{eyebrow}</p>}
        <h1 className="page-head__title">{title}</h1>
        {description && <p className="page-head__desc">{description}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  );
}
