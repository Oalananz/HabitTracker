// The logo's rounded terminal and prompt, drawn crisply at nav size.
export default function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-7 h-6 rounded-[5px] border-2 border-primary font-mono text-[11px] font-bold leading-none text-primary"
      >
        &gt;_
      </span>
      <span className="font-mono font-bold text-[17px] tracking-tight text-primary">HabitTerminal</span>
    </span>
  );
}
