import { useCallback, useRef, useState } from "react";
import { PinModal } from "../components/shared/PinModal";

export type PinModalType = "admin" | "salesman";

const TITLES: Record<PinModalType, string> = {
  admin: "Admin PIN Required",
  salesman: "Salesman PIN Required",
};

const DESCRIPTIONS: Record<PinModalType, string> = {
  admin: "Enter admin PIN to authorize this action.",
  salesman: "Enter your PIN to continue.",
};

export function usePinModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<PinModalType>("salesman");
  const [requestId, setRequestId] = useState(0);
  const resolveRef = useRef<((pin: string | null) => void) | null>(null);

  const getPin = useCallback((modalType: PinModalType = "salesman") => {
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      setType(modalType);
      setRequestId((id) => id + 1);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = (pin: string) => {
    setIsOpen(false);
    resolveRef.current?.(pin);
    resolveRef.current = null;
  };

  const handleClose = () => {
    setIsOpen(false);
    resolveRef.current?.(null);
    resolveRef.current = null;
  };

  const PinModalElement = (
    <PinModal
      key={requestId}
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={TITLES[type]}
      description={DESCRIPTIONS[type]}
    />
  );

  return { getPin, PinModalElement };
}
