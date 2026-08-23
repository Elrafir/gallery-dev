import 'dart:convert';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/models/server_profile.model.dart';

final serverProfilesServiceProvider = Provider((ref) => ServerProfilesService());

class ServerProfilesService {
  List<ServerProfile> getProfiles() {
    final raw = Store.get(StoreKey.serverProfiles, '[]');
    try {
      final list = json.decode(raw) as List<dynamic>;
      final profiles = list.map((e) => ServerProfile.fromMap(e as Map<String, dynamic>)).toList();
      profiles.sort((a, b) => b.lastUsedAt.compareTo(a.lastUsedAt));
      return profiles;
    } catch (_) {
      return [];
    }
  }

  void saveProfile({required String name, required String url}) {
    final cleanUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
    final cleanName = name.trim().isEmpty ? cleanUrl : name.trim();

    final profiles = getProfiles();
    final existingIndex = profiles.indexWhere((p) => p.url.toLowerCase() == cleanUrl.toLowerCase());

    if (existingIndex >= 0) {
      profiles[existingIndex] = profiles[existingIndex].copyWith(
        name: cleanName,
        lastUsedAt: DateTime.now(),
      );
    } else {
      profiles.insert(
        0,
        ServerProfile(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          name: cleanName,
          url: cleanUrl,
          createdAt: DateTime.now(),
          lastUsedAt: DateTime.now(),
        ),
      );
    }

    _persist(profiles);
  }

  void deleteProfile(String id) {
    final profiles = getProfiles().where((p) => p.id != id).toList();
    _persist(profiles);
  }

  void touchProfile(String url) {
    final cleanUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
    final profiles = getProfiles();
    final idx = profiles.indexWhere((p) => p.url.toLowerCase() == cleanUrl.toLowerCase());
    if (idx >= 0) {
      profiles[idx] = profiles[idx].copyWith(lastUsedAt: DateTime.now());
      _persist(profiles);
    }
  }

  void _persist(List<ServerProfile> profiles) {
    final encoded = json.encode(profiles.map((e) => e.toMap()).toList());
    Store.put(StoreKey.serverProfiles, encoded);
  }
}
