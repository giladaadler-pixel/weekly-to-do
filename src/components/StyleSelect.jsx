export default function StyleSelect({ value, onChange }) {
  return (
    <select className="style-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Description style">
      <option value="checklist">Checklist</option>
      <option value="bullets">Bullets</option>
      <option value="paragraph">Paragraph</option>
    </select>
  );
}
