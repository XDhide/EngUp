export default function Panel({ title, subtitle, action, footer, children, bodyClass = 'panel__body', className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <header className="panel__head">
          <div>
            {title && <h2 className="panel__title">{title}</h2>}
            {subtitle && <p className="panel__sub">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {bodyClass ? <div className={bodyClass}>{children}</div> : children}
      {footer && <footer className="panel__foot">{footer}</footer>}
    </section>
  );
}
