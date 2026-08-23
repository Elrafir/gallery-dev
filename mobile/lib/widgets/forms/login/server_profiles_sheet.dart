import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/server_profile.model.dart';
import 'package:immich_mobile/services/server_profiles.service.dart';

class ServerProfilesSheet extends ConsumerStatefulWidget {
  final String currentEndpoint;
  final ValueChanged<String> onProfileSelected;

  const ServerProfilesSheet({
    super.key,
    required this.currentEndpoint,
    required this.onProfileSelected,
  });

  @override
  ConsumerState<ServerProfilesSheet> createState() => _ServerProfilesSheetState();
}

class _ServerProfilesSheetState extends ConsumerState<ServerProfilesSheet> {
  late List<ServerProfile> _profiles;

  @override
  void initState() {
    super.initState();
    _loadProfiles();
  }

  void _loadProfiles() {
    setState(() {
      _profiles = ref.read(serverProfilesServiceProvider).getProfiles();
    });
  }

  void _showSaveDialog() {
    final nameController = TextEditingController(
      text: widget.currentEndpoint.contains('192.168.') ? 'Домашний сервер (WiFi)' : 'Мой сервер',
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Сохранить шаблон сервера', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Адрес: ${widget.currentEndpoint}', style: const TextStyle(fontSize: 13, color: Colors.grey)),
            const SizedBox(height: 12),
            TextField(
              controller: nameController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Название шаблона',
                hintText: 'Например: Дом, Дача, VPN',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Отмена')),
          ElevatedButton(
            onPressed: () {
              if (nameController.text.trim().isNotEmpty) {
                ref.read(serverProfilesServiceProvider).saveProfile(
                  name: nameController.text.trim(),
                  url: widget.currentEndpoint,
                );
                Navigator.of(ctx).pop();
                _loadProfiles();
              }
            },
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.themeData;
    final primaryColor = theme.primaryColor;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.bookmarks_outlined, color: primaryColor),
                  const SizedBox(width: 10),
                  const Text(
                    'Шаблоны серверов',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Быстрый выбор ранее сохраненных адресов серверов',
            style: TextStyle(fontSize: 13, color: theme.textTheme.bodyMedium?.color?.withOpacity(0.7)),
          ),
          const SizedBox(height: 16),
          if (widget.currentEndpoint.trim().isNotEmpty) ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.add, size: 18),
                label: Text('Сохранить текущий (${widget.currentEndpoint}) как шаблон'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: _showSaveDialog,
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (_profiles.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'Сохраненных шаблонов пока нет.\nВведите адрес сервера и нажмите «Сохранить как шаблон».',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: theme.textTheme.bodyMedium?.color?.withOpacity(0.6)),
                ),
              ),
            )
          else
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 280),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _profiles.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final profile = _profiles[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: primaryColor.withOpacity(0.12),
                      child: Icon(Icons.dns, color: primaryColor, size: 18),
                    ),
                    title: Text(profile.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: Text(profile.url, style: const TextStyle(fontSize: 12)),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20, color: Colors.redAccent),
                      onPressed: () {
                        ref.read(serverProfilesServiceProvider).deleteProfile(profile.id);
                        _loadProfiles();
                      },
                    ),
                    onTap: () {
                      ref.read(serverProfilesServiceProvider).touchProfile(profile.url);
                      widget.onProfileSelected(profile.url);
                      Navigator.of(context).pop();
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
