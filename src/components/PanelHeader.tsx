export function PanelHeader({ title, subtitle, action }: { title: string; subtitle: string; action: string }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <button className="small-button" type="button">{action}</button>
    </div>
  );
}
