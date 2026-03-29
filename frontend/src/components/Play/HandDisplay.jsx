export default function HandDisplay({ label, sum, usableAce, highlight }) {
  return (
    <div className={`hand-display ${highlight || ""}`}>
      <div className="hand-label">{label}</div>
      <div className="hand-sum">{sum}</div>
      {usableAce !== undefined && (
        <div className="hand-ace">{usableAce ? "Usable Ace" : ""}</div>
      )}
    </div>
  );
}
