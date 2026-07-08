interface AvatarProps {
  initial: string;
}

export function Avatar({ initial }: AvatarProps) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white">
      {initial}
    </div>
  );
}
