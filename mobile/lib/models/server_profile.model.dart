import 'dart:convert';

class ServerProfile {
  final String id;
  final String name;
  final String url;
  final DateTime createdAt;
  final DateTime lastUsedAt;

  const ServerProfile({
    required this.id,
    required this.name,
    required this.url,
    required this.createdAt,
    required this.lastUsedAt,
  });

  ServerProfile copyWith({
    String? id,
    String? name,
    String? url,
    DateTime? createdAt,
    DateTime? lastUsedAt,
  }) {
    return ServerProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      url: url ?? this.url,
      createdAt: createdAt ?? this.createdAt,
      lastUsedAt: lastUsedAt ?? this.lastUsedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'url': url,
      'createdAt': createdAt.toIso8601String(),
      'lastUsedAt': lastUsedAt.toIso8601String(),
    };
  }

  factory ServerProfile.fromMap(Map<String, dynamic> map) {
    return ServerProfile(
      id: map['id'] as String,
      name: map['name'] as String,
      url: map['url'] as String,
      createdAt: DateTime.tryParse(map['createdAt'] as String? ?? '') ?? DateTime.now(),
      lastUsedAt: DateTime.tryParse(map['lastUsedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerProfile.fromJson(String source) =>
      ServerProfile.fromMap(json.decode(source) as Map<String, dynamic>);
}
