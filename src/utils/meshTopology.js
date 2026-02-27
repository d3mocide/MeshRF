// ─── Helpers ──────────────────────────────────────────────────────────────────

export const STATUS_COLORS = {
    viable:   '#00f2ff',
    degraded: '#ffd700',
    blocked:  '#ff4444',
    unknown:  '#888',
};

export const STATUS_LABELS = {
    viable:   'Viable',
    degraded: 'Degraded',
    blocked:  'Blocked',
    unknown:  'Unknown',
};

/** Build adjacency list and find all viable multi-hop paths between every pair */
export function findMeshPaths(results, interNodeLinks) {
    if (!results || !interNodeLinks) return [];
    const n = results.length;
    // adjacency: node_idx -> list of {neighbor, status}
    const adj = Array.from({ length: n }, () => []);
    for (const link of interNodeLinks) {
        if (link.status === 'viable' || link.status === 'degraded') {
            adj[link.node_a_idx].push({ neighbor: link.node_b_idx, status: link.status });
            adj[link.node_b_idx].push({ neighbor: link.node_a_idx, status: link.status });
        }
    }

    const paths = [];
    // BFS shortest path for all pairs
    for (let src = 0; src < n; src++) {
        for (let dst = src + 1; dst < n; dst++) {
            // BFS
            const visited = new Array(n).fill(false);
            const queue = [{ node: src, path: [src], worstStatus: 'viable' }];
            visited[src] = true;
            let found = null;
            while (queue.length > 0 && !found) {
                const { node, path, worstStatus } = queue.shift();
                for (const { neighbor, status } of adj[node]) {
                    if (!visited[neighbor]) {
                        const newWorst = (worstStatus === 'degraded' || status === 'degraded') ? 'degraded' : 'viable';
                        const newPath = [...path, neighbor];
                        if (neighbor === dst) {
                            found = { path: newPath, status: newWorst };
                        } else {
                            visited[neighbor] = true;
                            queue.push({ node: neighbor, path: newPath, worstStatus: newWorst });
                        }
                    }
                }
            }
            if (found) {
                paths.push({
                    src,
                    dst,
                    path: found.path,
                    status: found.status,
                    hops: found.path.length - 1
                });
            } else {
                paths.push({ src, dst, path: [src, dst], status: 'blocked', hops: 1 });
            }
        }
    }
    return paths;
}
