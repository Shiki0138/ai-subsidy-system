export const showError = (message: string) => {
  console.error(message);
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(`エラー: ${message}`);
  }
};

export const showSuccess = (message: string) => {
  console.log(message);
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(`成功: ${message}`);
  }
};

export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return '予期しないエラーが発生しました';
};