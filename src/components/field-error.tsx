export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="text-xs font-normal text-destructive">
      {message}
    </span>
  );
}
