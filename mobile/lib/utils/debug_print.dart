import 'package:flutter/foundation.dart';

@pragma('vm:prefer-inline')
void dPrint(String Function() message) {
  debugPrint(message());
}
