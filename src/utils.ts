export function formatSchedule(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function placeLabel(code: string | null, text: string | null): string {
  if (!code) return '';
  const labels: Record<string, string> = {
    front_door: '현관 앞',
    security_office: '경비실',
    mailbox: '우편함',
    custom_place_text: text ?? '기타',
  };
  return labels[code] ?? code;
}

export function vehicleLabel(code: string): string {
  const labels: Record<string, string> = {
    'PICKUP-VAN-01': '수거 밴 1호',
    'PICKUP-VAN-02': '수거 밴 2호',
    'PICKUP-VAN-03': '수거 밴 3호',
  };
  return labels[code] ?? code;
}
