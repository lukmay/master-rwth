document.addEventListener('DOMContentLoaded', () => {
    // --- Globale Variablen ---
    let nfaNodes = new vis.DataSet();
    let nfaEdges = new vis.DataSet();
    let nfaStateCounter = 0;
    let nfaStartStateId = null;
    let nfaFinalStateIds = new Set();
    let nfaNetwork = null;
    let selectedNodeId = null; // Für Kanten und Zustands-Optionen

    let dfaNodes = new vis.DataSet();
    let dfaEdges = new vis.DataSet();
    let dfaNetwork = null;

    const EPSILON = 'ε'; // Konstante für Epsilon

    // --- NFA Netzwerk Initialisierung ---
    const nfaContainer = document.getElementById('nfa-graph');
    const nfaData = { nodes: nfaNodes, edges: nfaEdges };
    const nfaOptions = {
        interaction: {
            navigationButtons: true,
            keyboard: true, // Erlaubt löschen mit Entf
            selectConnectedEdges: false, // Kanten nicht mitauswählen
        },
        manipulation: {
             // Manuelles Hinzufügen von Kanten, um Label zu erfragen
            addEdge: function (edgeData, callback) {
                const label = prompt(`Symbol(e) für Kante von ${nfaNodes.get(edgeData.from).label} nach ${nfaNodes.get(edgeData.to).label}?\n(Leer für Epsilon ${EPSILON}, Komma für mehrere):`, "");
                if (label !== null) {
                    edgeData.label = label === "" ? EPSILON : label;
                    edgeData.arrows = 'to';
                    edgeData.font = { align: 'top' };
                    callback(edgeData); // Kante hinzufügen
                } else {
                    callback(null); // Abbrechen
                }
            },
            deleteNode: true, // Erlaube Löschen von Knoten (und verbundenen Kanten)
            deleteEdge: true, // Erlaube Löschen von Kanten
        },
        nodes: {
            shape: 'circle',
            font: { color: '#343434', size: 14 },
            borderWidth: 2,
            color: {
                border: '#2B7CE9',
                background: '#D2E5FF',
                highlight: { border: '#2B7CE9', background: '#FBDB8D' },
                hover: { border: '#2B7CE9', background: '#87BFFF' }
            }
        },
        edges: {
            arrows: 'to',
            smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 },
            font: { align: 'top' },
            color: {
                color: '#848484',
                highlight: '#848484',
                hover: '#2B7CE9',
            }
        },
        physics: { // Einfache Physik für bessere Anfangsanordnung
             enabled: true,
             solver: 'barnesHut',
             barnesHut: {
                 gravitationalConstant: -3000,
                 centralGravity: 0.1,
                 springLength: 120,
                 springConstant: 0.05,
                 damping: 0.1
             },
             stabilization: { iterations: 150 }
         }
    };
    nfaNetwork = new vis.Network(nfaContainer, nfaData, nfaOptions);

    // --- DFA Netzwerk Initialisierung ---
    const dfaContainer = document.getElementById('dfa-graph');
    const dfaData = { nodes: dfaNodes, edges: dfaEdges };
    const dfaOptions = { // Ähnlich wie NFA, aber keine Manipulation
        interaction: { navigationButtons: true, keyboard: false },
        manipulation: { enabled: false }, // DFA ist nur Anzeige
        nodes: nfaOptions.nodes, // Gleiche Grundstile
        edges: nfaOptions.edges, // Gleiche Grundstile
         physics: { // Kann helfen, große DFAs anzuordnen
            enabled: true,
             solver: 'repulsion', // Anderer Solver kann besser sein
             repulsion: {
                centralGravity: 0.1,
                springLength: 150,
                springConstant: 0.05,
                nodeDistance: 150, // Mehr Abstand
                damping: 0.1
             },
             stabilization: { iterations: 200 }
         }
    };
    dfaNetwork = new vis.Network(dfaContainer, dfaData, dfaOptions);


    // --- NFA Event Listener ---

    // Knoten hinzufügen
    document.getElementById('add-state-btn').addEventListener('click', () => {
        const newStateId = nfaStateCounter++;
        nfaNodes.add({ id: newStateId, label: `q${newStateId}` });
        nfaNetwork.fit(); // Ansicht anpassen
    });

    // Knoten auswählen
    nfaNetwork.on("selectNode", (params) => {
        selectedNodeId = params.nodes.length > 0 ? params.nodes[0] : null;
         console.log("Selected node:", selectedNodeId);
    });
    nfaNetwork.on("deselectNode", () => {
        selectedNodeId = null;
         console.log("Node deselected");
    });

     // Kante auswählen (nur für Info/Löschen)
     nfaNetwork.on("selectEdge", (params) => {
         console.log("Selected edge:", params.edges);
     });
      nfaNetwork.on("deselectEdge", () => {
         console.log("Edge deselected");
     });


    // Startzustand setzen
    document.getElementById('set-start-btn').addEventListener('click', () => {
        if (selectedNodeId !== null) {
            // Alten Startzustand zurücksetzen (visuell)
            if (nfaStartStateId !== null && nfaNodes.get(nfaStartStateId)) {
                let oldStartNode = nfaNodes.get(nfaStartStateId);
                 // Prüfen, ob es auch ein Final State ist, bevor Klasse entfernt wird
                 let classes = ['vis-node']; // Basisklasse
                 if(nfaFinalStateIds.has(nfaStartStateId)) classes.push('final-node');
                 oldStartNode.group = classes.join(' '); // Klassen aktualisieren
                nfaNodes.update(oldStartNode);
            }

            // Neuen Startzustand setzen
            nfaStartStateId = selectedNodeId;
            let newStartNode = nfaNodes.get(nfaStartStateId);
            let classes = ['vis-node', 'start-node'];
            if(nfaFinalStateIds.has(nfaStartStateId)) classes.push('final-node');
            newStartNode.group = classes.join(' '); // Gruppe für CSS-Klasse nutzen
            nfaNodes.update(newStartNode);
            console.log("Start state set to:", nfaStartStateId);
        } else {
            alert("Bitte zuerst einen Knoten auswählen.");
        }
    });

    // Finalen Zustand umschalten
    document.getElementById('toggle-final-btn').addEventListener('click', () => {
        if (selectedNodeId !== null) {
            const node = nfaNodes.get(selectedNodeId);
            let classes = ['vis-node'];
            if (nfaFinalStateIds.has(selectedNodeId)) {
                // Entfernen
                nfaFinalStateIds.delete(selectedNodeId);
                 if(selectedNodeId === nfaStartStateId) classes.push('start-node'); // Start bleibt
                console.log("Final state removed:", selectedNodeId);
            } else {
                // Hinzufügen
                nfaFinalStateIds.add(selectedNodeId);
                classes.push('final-node');
                 if(selectedNodeId === nfaStartStateId) classes.push('start-node'); // Start bleibt
                console.log("Final state added:", selectedNodeId);
            }
             node.group = classes.join(' '); // Klassen aktualisieren
             nfaNodes.update(node);
        } else {
            alert("Bitte zuerst einen Knoten auswählen.");
        }
    });

    // Konvertierungs-Button
    document.getElementById('convert-btn').addEventListener('click', () => {
        const alphabetInput = document.getElementById('alphabet-input').value.trim();
        if (!alphabetInput) {
            alert("Bitte das Eingabealphabet definieren (z.B. a,b)");
            return;
        }
        if (nfaStartStateId === null) {
            alert("Bitte einen Startzustand für den NFA festlegen.");
            return;
        }

        const alphabet = alphabetInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (alphabet.length === 0) {
             alert("Alphabet ungültig. Bitte Symbole durch Komma trennen.");
             return;
        }
         // Stelle sicher, dass Epsilon nicht explizit im Alphabet ist
         if (alphabet.includes(EPSILON)) {
             alert(`Das Symbol '${EPSILON}' ist für Epsilon-Übergänge reserviert und darf nicht Teil des Eingabealphabets sein.`);
             return;
         }


        console.log("Starte Konvertierung...");
        console.log("Alphabet:", alphabet);
        console.log("NFA Start State ID:", nfaStartStateId);
        console.log("NFA Final State IDs:", Array.from(nfaFinalStateIds));

        // NFA Daten für Algorithmus aufbereiten
        const nfa = buildNfaStructure(alphabet);
        if (!nfa) return; // Fehler beim Aufbau

        console.log("NFA Struktur für Algorithmus:", nfa);

        // DFA berechnen
        const dfa = convertNfaToDfa(nfa);
        console.log("DFA Ergebnis:", dfa);

        // DFA anzeigen
        displayDfaGraph(dfa);
        displayDfaText(dfa);
    });


    // --- Hilfsfunktionen ---

    // Baut eine interne NFA-Struktur aus den vis-Daten
    function buildNfaStructure(alphabet) {
        const transitions = {}; // { stateId: { symbol: Set(targetId, ...), ... }, ... }
        const states = new Set();

        nfaNodes.getIds().forEach(id => {
            states.add(id);
            transitions[id] = {}; // Initialisiere Übergänge für jeden Zustand
             // Füge leere Sets für jedes Alphabet-Symbol und Epsilon hinzu
             alphabet.forEach(symbol => transitions[id][symbol] = new Set());
             transitions[id][EPSILON] = new Set(); // Immer Epsilon initialisieren
        });


        nfaEdges.get().forEach(edge => {
            const from = edge.from;
            const to = edge.to;
            const labels = edge.label ? edge.label.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

             if (!states.has(from) || !states.has(to)) {
                 console.warn(`Überspringe Kante ${edge.id}, da Knoten ${from} oder ${to} nicht (mehr) existiert.`);
                 return; // Ignoriere Kanten zu/von gelöschten Knoten
             }

            labels.forEach(label => {
                 const symbol = label === "" ? EPSILON : label; // Leerstring als Epsilon interpretieren

                 // Überprüfe, ob Symbol (wenn nicht Epsilon) im definierten Alphabet ist
                 if (symbol !== EPSILON && !alphabet.includes(symbol)) {
                     alert(`Warnung: Symbol '${symbol}' in Kante von q${from} nach q${to} ist nicht Teil des definierten Alphabets (${alphabet.join(',')}) und wird ignoriert.`);
                     return; // Überspringe dieses Label
                 }

                if (!transitions[from]) {
                    console.warn(`Fehlender Übergangseintrag für Zustand ${from}, initialisiere.`);
                    transitions[from] = {};
                }
                if (!transitions[from][symbol]) {
                    transitions[from][symbol] = new Set();
                }
                transitions[from][symbol].add(to);
            });
        });

        // Überprüfung auf Vollständigkeit
         if (nfaStartStateId === null || !states.has(nfaStartStateId)) {
             alert("Fehler: Startzustand ist ungültig oder nicht mehr vorhanden.");
             return null;
         }
          // Sicherstellen, dass nur existierende States als Final markiert sind
         const validFinalStates = new Set([...nfaFinalStateIds].filter(id => states.has(id)));


        return {
            states: states,
            alphabet: new Set(alphabet),
            transitions: transitions,
            startState: nfaStartStateId,
            finalStates: validFinalStates
        };
    }

    // --- NFA zu DFA Konvertierungsalgorithmus (Iterative Potenzmengenkonstruktion) ---

    // Berechnet die Epsilon-Hülle für eine Menge von NFA-Zuständen
    function epsilonClosure(nfaStates, nfaTransitions) {
        let closure = new Set(nfaStates);
        let stack = [...nfaStates]; // Worklist

        while (stack.length > 0) {
            const currentState = stack.pop();
            const epsilonTransitions = nfaTransitions[currentState]?.[EPSILON] || new Set();

            epsilonTransitions.forEach(targetState => {
                if (!closure.has(targetState)) {
                    closure.add(targetState);
                    stack.push(targetState);
                }
            });
        }
         // Wichtig: Rückgabe als Set für einfache Vergleiche/Nutzung
        return closure;
    }

    // Berechnet die Menge der Zustände, die von einer Menge nfaStates via symbol erreichbar sind
    function move(nfaStates, symbol, nfaTransitions) {
        let reachableStates = new Set();
        nfaStates.forEach(state => {
            const symbolTransitions = nfaTransitions[state]?.[symbol] || new Set();
            symbolTransitions.forEach(targetState => {
                reachableStates.add(targetState);
            });
        });
        return reachableStates;
    }

    // Konvertiert NFA zu DFA
    function convertNfaToDfa(nfa) {
        const dfaStates = new Map(); // Map: frozenset(nfaStates) -> { id: dfaStateId, isFinal: bool, nfaStates: set }
        const dfaTransitions = new Map(); // Map: dfaStateId -> { symbol: targetDfaStateId, ... }
        const worklist = []; // Queue für zu verarbeitende DFA-Zustände (repräsentiert als frozenset)
        let dfaStateCounter = 0;
        const SINK_STATE_ID = '∅'; // Spezielle ID für den leeren Zustand

        // Hilfsfunktion, um ein Set in einen sortierten String-Schlüssel zu verwandeln (für Map-Keys)
         const stateSetToKey = (stateSet) => {
            return Array.from(stateSet).sort((a, b) => a - b).join(','); // Sortieren ist wichtig für Konsistenz!
        };


        // 1. Startzustand des DFA bestimmen (Epsilon-Hülle des NFA-Startzustands)
        const nfaStartClosure = epsilonClosure([nfa.startState], nfa.transitions);
         const startStateKey = stateSetToKey(nfaStartClosure);


        // Füge Startzustand zur Worklist und dfaStates hinzu
        if (!dfaStates.has(startStateKey)) {
             const startDfaId = `D${dfaStateCounter++}`;
             const isStartFinal = [...nfaStartClosure].some(s => nfa.finalStates.has(s));
             dfaStates.set(startStateKey, { id: startDfaId, isFinal: isStartFinal, nfaStates: nfaStartClosure });
             dfaTransitions.set(startDfaId, {});
             worklist.push(nfaStartClosure);
        }

        let sinkStateCreated = false;


        // 2. Iterativ DFA-Zustände und Übergänge berechnen
        while (worklist.length > 0) {
            const currentNfaStatesSet = worklist.shift(); // Nimm ersten Zustand aus der Worklist
            const currentKey = stateSetToKey(currentNfaStatesSet);
            const currentDfaState = dfaStates.get(currentKey);
            const currentDfaId = currentDfaState.id;

            // Für jedes Symbol im Alphabet
            nfa.alphabet.forEach(symbol => {
                // Berechne move(currentNfaStates, symbol)
                const moveResult = move(currentNfaStatesSet, symbol, nfa.transitions);
                // Berechne Epsilon-Hülle des Ergebnisses
                const nextNfaStatesSet = epsilonClosure(moveResult, nfa.transitions);
                const nextKey = stateSetToKey(nextNfaStatesSet);

                let targetDfaId;

                // Wenn die resultierende Menge leer ist -> Übergang zum Sink-Zustand
                 if (nextNfaStatesSet.size === 0) {
                    if (!sinkStateCreated) {
                         // Erzeuge Sink-Zustand nur bei Bedarf
                         dfaStates.set('sink', { id: SINK_STATE_ID, isFinal: false, nfaStates: new Set() });
                         dfaTransitions.set(SINK_STATE_ID, {});
                         // Füge Übergänge vom Sink zu sich selbst für alle Symbole hinzu
                         nfa.alphabet.forEach(sym => {
                             dfaTransitions.get(SINK_STATE_ID)[sym] = SINK_STATE_ID;
                         });
                         sinkStateCreated = true;
                         console.log("Sink State ∅ created.");
                     }
                     targetDfaId = SINK_STATE_ID;

                 } else {
                    // Wenn der Zielzustand (als Menge von NFA-Zuständen) noch nicht existiert
                    if (!dfaStates.has(nextKey)) {
                        const newDfaId = `D${dfaStateCounter++}`;
                        const isNewFinal = [...nextNfaStatesSet].some(s => nfa.finalStates.has(s));
                        dfaStates.set(nextKey, { id: newDfaId, isFinal: isNewFinal, nfaStates: nextNfaStatesSet });
                        dfaTransitions.set(newDfaId, {});
                        worklist.push(nextNfaStatesSet); // Füge neuen Zustand zur Verarbeitung hinzu
                        targetDfaId = newDfaId;
                        console.log(`New DFA state created: ${newDfaId} representing {${Array.from(nextNfaStatesSet).map(s=>`q${s}`).join(',')}}`);
                    } else {
                        // Zustand existiert bereits
                        targetDfaId = dfaStates.get(nextKey).id;
                    }
                }
                 // Füge Übergang hinzu
                 dfaTransitions.get(currentDfaId)[symbol] = targetDfaId;
                 console.log(`Transition added: δ(${currentDfaId}, ${symbol}) = ${targetDfaId}`);

            });
        }

        // 3. DFA-Struktur für die Anzeige zusammenstellen
        const finalDfaStates = [];
        const finalDfaTransitions = {}; // Format: { fromId: { symbol: toId, ... }, ...}
        const dfaStateInfo = {}; // { dfaId: { label: '...', isStart: bool, isFinal: bool }, ... }

         const startDfaId = dfaStates.get(startStateKey)?.id;

        dfaStates.forEach((stateData, key) => {
            const label = stateData.id === SINK_STATE_ID
                ? SINK_STATE_ID
                : `${stateData.id}: {${Array.from(stateData.nfaStates).map(s => `q${s}`).sort((a,b)=> parseInt(a.substring(1)) - parseInt(b.substring(1))).join(',')}}`;

            finalDfaStates.push(stateData.id);
            dfaStateInfo[stateData.id] = {
                 label: label,
                 isStart: stateData.id === startDfaId,
                 isFinal: stateData.isFinal,
                 isSink: stateData.id === SINK_STATE_ID
            };
             // Übergänge kopieren
             if (dfaTransitions.has(stateData.id)) {
                  finalDfaTransitions[stateData.id] = { ...dfaTransitions.get(stateData.id) };
             }
        });


        return {
            states: finalDfaStates,
            alphabet: Array.from(nfa.alphabet),
            transitions: finalDfaTransitions,
            startState: startDfaId,
            finalStates: finalDfaStates.filter(id => dfaStateInfo[id].isFinal),
            stateInfo: dfaStateInfo // Zusätzliche Infos für Darstellung
        };
    }


    // --- DFA Anzeige Funktionen ---

    function displayDfaGraph(dfa) {
        dfaNodes.clear();
        dfaEdges.clear();

        // Knoten hinzufügen
        dfa.states.forEach(stateId => {
            const info = dfa.stateInfo[stateId];
            let classes = ['vis-node'];
             if (info.isStart) classes.push('start-node');
             if (info.isFinal) classes.push('final-node');
             if (info.isSink) classes.push('sink-node');

            dfaNodes.add({
                id: stateId,
                label: info.label,
                 group: classes.join(' ') // Klassen für Styling nutzen
            });
        });

         // Kanten hinzufügen (gruppieren nach Ziel)
         const edgesToAdd = [];
         const edgeMap = {}; // key: 'fromId_toId', value: { labels: [], from: fromId, to: toId }

         dfa.states.forEach(fromId => {
             if (dfa.transitions[fromId]) {
                 dfa.alphabet.forEach(symbol => {
                     const toId = dfa.transitions[fromId][symbol];
                     if (toId !== undefined) { // Nur definierte Übergänge
                         const key = `${fromId}_${toId}`;
                         if (!edgeMap[key]) {
                             edgeMap[key] = { labels: [], from: fromId, to: toId };
                         }
                         edgeMap[key].labels.push(symbol);
                     }
                 });
             }
         });

         // Gruppierte Kanten erstellen
         Object.values(edgeMap).forEach(edgeInfo => {
             edgesToAdd.push({
                 from: edgeInfo.from,
                 to: edgeInfo.to,
                 label: edgeInfo.labels.sort().join(','), // Sortieren für konsistente Darstellung
                 arrows: 'to',
                 font: { align: 'top' }
             });
         });


        dfaEdges.add(edgesToAdd);

        // Optional: Stabilisierung und Ansicht anpassen
         dfaNetwork.stabilize(); // Physik kurz laufen lassen
        dfaNetwork.fit(); // Zoom/Pan anpassen
    }

    function displayDfaText(dfa) {
        let text = `Zustände Q = {${dfa.states.join(', ')}}\n`;
        text += `Alphabet Σ = {${dfa.alphabet.join(', ')}}\n`;
        text += `Startzustand q₀ = ${dfa.startState}\n`;
        text += `Endzustände F = {${dfa.finalStates.join(', ') || 'Keine'}}\n\n`;
        text += `Übergangsfunktion δ:\n`;

        // Sortierte Zustände für bessere Lesbarkeit
         const sortedStates = [...dfa.states].sort((a, b) => {
             if (a === SINK_STATE_ID) return 1; // Sink ans Ende
             if (b === SINK_STATE_ID) return -1;
             return a.localeCompare(b, undefined, { numeric: true }); // Sortiere D0, D1, D2...
         });

        sortedStates.forEach(stateId => {
             if (dfa.transitions[stateId]) {
                 dfa.alphabet.forEach(symbol => {
                     const targetState = dfa.transitions[stateId][symbol];
                     if (targetState !== undefined) { // Nur definierte Übergänge anzeigen
                        text += `  δ(${stateId}, ${symbol}) = ${targetState}\n`;
                     } else {
                         // Optional: Anzeigen, wenn ein Übergang fehlt (sollte nicht passieren, wenn Sink korrekt ist)
                         // text += `  δ(${stateId}, ${symbol}) = ???\n`;
                     }
                 });
             } else if (stateId !== SINK_STATE_ID) { // Wenn keine Übergänge definiert sind (außer Sink)
                 text += `  (Keine ausgehenden Übergänge für ${stateId})\n`;
             }
        });

         text += `\nZustandsdetails (DFA-Zustand = {NFA-Zustände}):\n`;
         sortedStates.forEach(stateId => {
             text += `  ${dfa.stateInfo[stateId].label}\n`;
         });


        document.getElementById('dfa-text').textContent = text;
    }

});