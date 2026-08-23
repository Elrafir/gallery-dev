import 'dart:async';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/services/server_discovery.service.dart';

class ServerScannerDialog extends StatefulWidget {
  final ValueChanged<String> onServerSelected;

  const ServerScannerDialog({super.key, required this.onServerSelected});

  @override
  State<ServerScannerDialog> createState() => _ServerScannerDialogState();
}

class _ServerScannerDialogState extends State<ServerScannerDialog> with SingleTickerProviderStateMixin {
  final ServerDiscoveryService _discoveryService = ServerDiscoveryService();
  final List<DiscoveredServer> _foundServers = [];
  bool _isScanning = true;
  StreamSubscription<DiscoveredServer>? _subscription;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _startScan();
  }

  void _startScan() {
    setState(() {
      _foundServers.clear();
      _isScanning = true;
    });

    _subscription?.cancel();
    _subscription = _discoveryService.scanSubnets().listen(
      (server) {
        if (mounted) {
          setState(() {
            if (!_foundServers.any((s) => s.url == server.url)) {
              _foundServers.add(server);
            }
          });
        }
      },
      onDone: () {
        if (mounted) {
          setState(() {
            _isScanning = false;
          });
        }
      },
      onError: (_) {
        if (mounted) {
          setState(() {
            _isScanning = false;
          });
        }
      },
    );
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.themeData;
    final primaryColor = theme.primaryColor;

    return AlertDialog(
      title: Row(
        children: [
          if (_isScanning)
            RotationTransition(
              turns: _animController,
              child: Icon(Icons.radar, color: primaryColor),
            )
          else
            Icon(Icons.dns_outlined, color: primaryColor),
          const SizedBox(width: 12),
          Text(
            _isScanning ? 'Поиск серверов в сети...' : 'Найденные серверы',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        height: 320,
        child: Column(
          children: [
            if (_isScanning)
              LinearProgressIndicator(
                color: primaryColor,
                backgroundColor: primaryColor.withOpacity(0.2),
              ),
            const SizedBox(height: 8),
            Expanded(
              child: _foundServers.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          _isScanning
                              ? 'Сканируем локальную подсеть (IPv4: порт 2283)...'
                              : 'В локальной сети серверы не обнаружены.\nПроверьте, включён ли Wi-Fi.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: theme.textTheme.bodyMedium?.color?.withOpacity(0.7),
                            fontSize: 13,
                          ),
                        ),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _foundServers.length,
                      itemBuilder: (context, index) {
                        final server = _foundServers[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          elevation: 1,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                            side: BorderSide(
                              color: primaryColor.withOpacity(0.3),
                            ),
                          ),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: primaryColor.withOpacity(0.15),
                              child: Icon(Icons.photo_library_outlined, color: primaryColor, size: 20),
                            ),
                            title: Text(
                              server.serverName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            subtitle: Text(
                              '${server.url} (${server.version}, ${server.responseTimeMs} ms)',
                              style: const TextStyle(fontSize: 12),
                            ),
                            trailing: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                widget.onServerSelected(server.url);
                                Navigator.of(context).pop();
                              },
                              child: const Text('Выбрать', style: TextStyle(fontSize: 12)),
                            ),
                            onTap: () {
                              widget.onServerSelected(server.url);
                              Navigator.of(context).pop();
                            },
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      actions: [
        if (!_isScanning)
          TextButton.icon(
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Повторить поиск'),
            onPressed: _startScan,
          ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Закрыть'),
        ),
      ],
    );
  }
}
