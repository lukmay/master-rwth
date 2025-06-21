from collections import Counter, defaultdict

# --- Log definieren ---
log_L = (
    3 * [['a', 'b', 'c', 'd']] +
    4 * [['a', 'c', 'b', 'd']] +
    2 * [['a', 'b', 'c', 'e', 'f', 'b', 'c', 'd']] +
    [['a', 'b', 'c', 'e', 'f', 'c', 'b', 'd']] +
    2 * [['a', 'c', 'b', 'e', 'f', 'b', 'c', 'd']] +
    [['a', 'c', 'b', 'e', 'f', 'b', 'c', 'e', 'f', 'c', 'b', 'd']]
)

# log_L = (
#     3 * [['a', 'b', 'c', 'd']] +
#     2 * [['a', 'c', 'b', 'd']] +
#     [['a','e','d']]
# )

# --- Hilfsfunktionen ---
def all_prefixes(trace):
    return [trace[:i] for i in range(len(trace)+1)]

def to_multiset(trace):
    return frozenset(Counter(trace).items())

# --- TRACE-PREFIXE (sequenzielle Präfixe) ---
trace_prefixes = set()
for trace in log_L:
    for p in all_prefixes(trace):
        trace_prefixes.add(tuple(p))

print("=== TRACE-PREFIXE ===")
print("Anzahl unterschiedlicher Traces:", len(log_L))
print("Anzahl unterschiedlicher Prefixe über alle Traces:", len(trace_prefixes))

# --- SET-PREFIXE ---
set_groups = defaultdict(list)
for trace in log_L:
    key = frozenset(trace)
    set_groups[key].append(trace)

set_prefixes = set()
for traces in set_groups.values():
    for trace in traces:
        for p in all_prefixes(trace):
            set_prefixes.add(frozenset(p))  # Reihenfolge ignorieren

print("\n=== SET-PREFIXE ===")
print("Anzahl unterschiedlicher Sets:", len(set_groups))
print("Anzahl unterschiedlicher Set-Prefixe:", len(set_prefixes))

for i, prefix in enumerate(sorted(set_prefixes, key=lambda x: (len(x), sorted(x))), 1):
    print(f"{i:3}: {sorted(prefix)}")

# --- MULTISET-PREFIXE ---
multiset_groups = defaultdict(list)
for trace in log_L:
    key = to_multiset(trace)
    multiset_groups[key].append(trace)

multiset_prefixes = set()
for traces in multiset_groups.values():
    for trace in traces:
        for p in all_prefixes(trace):
            multiset_prefixes.add(frozenset(Counter(p).items()))  # Reihenfolge ignorieren, Häufigkeit beachten

print("\n=== MULTISET-PREFIXE ===")
print("Anzahl unterschiedlicher Multisets:", len(multiset_groups))
print("Anzahl unterschiedlicher Multiset-Prefixe:", len(multiset_prefixes))

for i, prefix in enumerate(sorted(multiset_prefixes, key=lambda x: (sum(count for _, count in x), sorted(x))), 1):
    prefix_str = [f"{k}:{v}" for k, v in sorted(prefix)]
    print(f"{i:3}: {prefix_str}")
