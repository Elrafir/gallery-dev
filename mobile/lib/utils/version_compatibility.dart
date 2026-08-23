String? getVersionCompatibilityMessage(int appMajor, int appMinor, int serverMajor, int serverMinor) {
  // Allow all 2.x versions to work without blocking
  if (appMajor == 2 && serverMajor == 2) {
    return null;
  }

  if (serverMajor != appMajor) {
    return 'Предупреждение: мажорная версия приложения ($appMajor) отличается от сервера ($serverMajor).';
  }

  return null;
}
