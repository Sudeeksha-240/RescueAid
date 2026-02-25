document.addEventListener("DOMContentLoaded", () => {
    // ===== LANGUAGE & LOCALIZATION =====
    let languages = {};
    let nodeTranslations = {};
    let currentLanguage = localStorage.getItem('rescueAid_language') || 'en';
    let decisionTree = null;
    let voiceControlEnabled = localStorage.getItem('rescueAid_voiceControl') === 'true';

    // Voice Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognizer = null;

    if (SpeechRecognition) {
        recognizer = new SpeechRecognition();
        recognizer.continuous = false;
        recognizer.interimResults = false;
        recognizer.lang = currentLanguage === 'es' ? 'es-ES' : 
                          currentLanguage === 'fr' ? 'fr-FR' : 
                          currentLanguage === 'de' ? 'de-DE' : 
                          currentLanguage === 'pt' ? 'pt-PT' :
                          currentLanguage === 'hi' ? 'hi-IN' :
                          currentLanguage === 'ta' ? 'ta-IN' :
                          currentLanguage === 'te' ? 'te-IN' :
                          currentLanguage === 'bn' ? 'bn-IN' : 'en-US';
    }

    // Load Languages with offline fallback
    function loadLanguages() {
        return fetch('/static/data/languages.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                languages = data;
                console.log('[Offline] Languages loaded successfully');
                initializeUI();
                setupEventListeners();
                loadTreeData();
            })
            .catch(err => {
                console.log('[Offline] Network failed, trying cache...');
                // Fallback to cached data if available
                if ('caches' in window) {
                    caches.match('/static/data/languages.json')
                        .then(response => {
                            if (response) {
                                return response.json().then(data => {
                                    languages = data;
                                    console.log('[Offline] Languages loaded from cache');
                                    initializeUI();
                                    setupEventListeners();
                                    loadTreeData();
                                });
                            } else {
                                console.error('[Offline] No cached languages available');
                                // Use minimal offline strings as last resort
                                languages = getOfflineFallbackLanguages();
                                initializeUI();
                                setupEventListeners();
                                loadTreeData();
                            }
                        });
                } else {
                    console.error('[Offline] Cache not available:', err);
                    languages = getOfflineFallbackLanguages();
                    initializeUI();
                    setupEventListeners();
                    loadTreeData();
                }
            });
    }

    // Fallback languages for complete offline support
    function getOfflineFallbackLanguages() {
        return {
            "en": {"name":"English","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ WARNING","disclaimerText":"Rescue Aid is offline guidance only.","disclaimerWarning":"Call 112 for emergencies.","acceptDisclaimer":"I Understand","emergency":"📞 CALL 112","homeTitle":"Emergency?","homeSubtitle":"Select an option.","back":"← Back","yes":"YES","no":"NO","done":"Done","voiceEnabled":"🎤 Voice On","voiceDisabled":"🎤 Voice Off","listening":"🔴 Listening...","voiceYes":"Say 'YES'","voiceNo":"Say 'NO'","disclaimerFooter":"⚠️ Emergency first aid tool only."}},
            "es": {"name":"Español","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ ADVERTENCIA","disclaimerText":"Rescue Aid es orientación offline.","disclaimerWarning":"Llama 112 para emergencias.","acceptDisclaimer":"Entiendo","emergency":"📞 LLAMAR 112","homeTitle":"¿Emergencia?","homeSubtitle":"Selecciona una opción.","back":"← Volver","yes":"SÍ","no":"NO","done":"Hecho","voiceEnabled":"🎤 Voz On","voiceDisabled":"🎤 Voz Off","listening":"🔴 Escuchando...","voiceYes":"Di 'SÍ'","voiceNo":"Di 'NO'","disclaimerFooter":"⚠️ Solo herramienta de primeros auxilios."}},
            "fr": {"name":"Français","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ AVERTISSEMENT","disclaimerText":"Rescue Aid est hors ligne.","disclaimerWarning":"Appelez 112 pour urgences.","acceptDisclaimer":"Je comprends","emergency":"📞 APPELER 112","homeTitle":"Urgence?","homeSubtitle":"Sélectionnez une option.","back":"← Retour","yes":"OUI","no":"NON","done":"Terminer","voiceEnabled":"🎤 Vocal On","voiceDisabled":"🎤 Vocal Off","listening":"🔴 Écoute...","voiceYes":"Dites 'OUI'","voiceNo":"Dites 'NON'","disclaimerFooter":"⚠️ Outil de premiers secours uniquement."}},
            "de": {"name":"Deutsch","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ WARNUNG","disclaimerText":"Rescue Aid ist offline.","disclaimerWarning":"Wähle 112 für Notfälle.","acceptDisclaimer":"Ich verstehe","emergency":"📞 112 ANRUFEN","homeTitle":"Notfall?","homeSubtitle":"Wählen Sie eine Option.","back":"← Zurück","yes":"JA","no":"NEIN","done":"Fertig","voiceEnabled":"🎤 Sprache An","voiceDisabled":"🎤 Sprache Aus","listening":"🔴 Höre...","voiceYes":"Sagen Sie 'JA'","voiceNo":"Sagen Sie 'NEIN'","disclaimerFooter":"⚠️ Nur Erste-Hilfe-Tool."}},
            "pt": {"name":"Português","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ AVISO","disclaimerText":"Rescue Aid é offline.","disclaimerWarning":"Ligue 112 para emergências.","acceptDisclaimer":"Entendo","emergency":"📞 LIGAR 112","homeTitle":"Emergência?","homeSubtitle":"Selecione uma opção.","back":"← Voltar","yes":"SIM","no":"NÃO","done":"Pronto","voiceEnabled":"🎤 Voz On","voiceDisabled":"🎤 Voz Off","listening":"🔴 Ouvindo...","voiceYes":"Diga 'SIM'","voiceNo":"Diga 'NÃO'","disclaimerFooter":"⚠️ Apenas ferramenta de primeiros socorros."}},
            "hi": {"name":"हिंदी","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ चेतावनी","disclaimerText":"Rescue Aid ऑफलाइन है।","disclaimerWarning":"आपातकाल के लिए 112 कॉल करें।","acceptDisclaimer":"मैं समझता हूं","emergency":"📞 112 कॉल करें","homeTitle":"आपातकाल?","homeSubtitle":"एक विकल्प चुनें।","back":"← वापस","yes":"हाँ","no":"नहीं","done":"पूर्ण","voiceEnabled":"🎤 आवाज़ चालू","voiceDisabled":"🎤 आवाज़ बंद","listening":"🔴 सुन रहे हैं...","voiceYes":"'हाँ' कहें","voiceNo":"'नहीं' कहें","disclaimerFooter":"⚠️ केवल प्राथमिक चिकित्सा उपकरण।"}},
            "ta": {"name":"தமிழ்","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ எச்சரிக்கை","disclaimerText":"Rescue Aid ஆஃப்லைன்.","disclaimerWarning":"அவசரத்திற்கு 112 அழைக்கவும்.","acceptDisclaimer":"நான் புரிந்துகொள்கிறேன்","emergency":"📞 112 அழைக்கவும்","homeTitle":"அவசரம்?","homeSubtitle":"ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்.","back":"← திரும்பவும்","yes":"ஆம்","no":"இல்லை","done":"முடிந்தது","voiceEnabled":"🎤 குரல் இயக்கு","voiceDisabled":"🎤 குரல் முடக்கு","listening":"🔴 கேட்டுக்கொண்டிருக்கிறேன்...","voiceYes":"'ஆம்' சொல்லவும்","voiceNo":"'இல்லை' சொல்லவும்","disclaimerFooter":"⚠️ முதல் உதவி கருவி மட்டுமே."}},
            "te": {"name":"తెలుగు","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ హెచ్చరిక","disclaimerText":"Rescue Aid ఆఫ్‌లైన్.","disclaimerWarning":"అత్యవసరమైనవాటికి 112 కాల్ చేయండి.","acceptDisclaimer":"నేను అర్థం చేసుకున్నాను","emergency":"📞 112 కాల్ చేయండి","homeTitle":"అత్యవసరం?","homeSubtitle":"ఒక ఆప్షన్ ఎంచుకోండి.","back":"← తిరిగి","yes":"అవును","no":"లేదు","done":"పూర్తి","voiceEnabled":"🎤 వాయిస్ ఆన్","voiceDisabled":"🎤 వాయిస్ ఆఫ్","listening":"🔴 వినడం...","voiceYes":"'అవును' అని చెప్పండి","voiceNo":"'లేదు' అని చెప్పండి","disclaimerFooter":"⚠️ మొదటి సహాయ సాధనం మాత్రమే."}},
            "bn": {"name":"বাংলা","ui":{"title":"Rescue Aid","disclaimerTitle":"⚠️ সতর্কতা","disclaimerText":"Rescue Aid অফলাইন।","disclaimerWarning":"জরুরি অবস্থায় 112 কল করুন।","acceptDisclaimer":"আমি বুঝলাম","emergency":"📞 112 কল করুন","homeTitle":"জরুরি?","homeSubtitle":"একটি বিকল্প নির্বাচন করুন।","back":"← ফিরে যান","yes":"হ্যাঁ","no":"না","done":"সম্পন্ন","voiceEnabled":"🎤 কণ্ঠস্বর চালু","voiceDisabled":"🎤 কণ্ঠস্বর বন্ধ","listening":"🔴 শুনছি...","voiceYes":"'হ্যাঁ' বলুন","voiceNo":"'না' বলুন","disclaimerFooter":"⚠️ শুধুমাত্র প্রথম সহায়তা সরঞ্জাম।"}}
        };
    }

    loadLanguages();

    function t(key) {
        const keys = key.split('.');
        let value = languages[currentLanguage]?.ui || {};
        
        for (let k of keys) {
            value = value[k];
            if (!value) return key;
        }
        return value;
    }

    function initializeUI() {
        // Update all UI text
        document.documentElement.lang = currentLanguage;
        document.title = t('title');
        
        // Header
        document.querySelector('.emergency-call-btn').innerText = t('emergency');
        
        // Modal
        document.getElementById('modal-title').innerText = languages[currentLanguage].ui.disclaimerTitle;
        document.getElementById('modal-text1').innerHTML = languages[currentLanguage].ui.disclaimerText;
        document.getElementById('modal-text2').innerText = languages[currentLanguage].ui.disclaimerWarning;
        document.getElementById('accept-disclaimer').innerText = t('acceptDisclaimer');
        
        // Home Screen
        document.getElementById('home-title').innerText = t('homeTitle');
        document.getElementById('home-subtitle').innerText = t('homeSubtitle');
        document.getElementById('home-disclaimer').innerHTML = 
            `<strong>⚠️ ${t('disclaimerTitle').replace('⚠️ CRITICAL WARNING', 'Disclaimer')}:</strong> ${t('disclaimerFooter')}`;
        
        // Buttons
        document.getElementById('btn-back').innerText = t('back');
        document.getElementById('btn-yes').innerText = t('yes');
        document.getElementById('btn-no').innerText = t('no');
        document.getElementById('btn-done').innerText = t('done');
        
        // Voice Control Button
        updateVoiceButton();
        
        // Language Selector
        document.getElementById('language-selector').value = currentLanguage;
    }

    function setupEventListeners() {
        console.log('[Setup] Attaching event listeners...');
        
        // Check if elements exist
        const langSelector = document.getElementById('language-selector');
        const voiceBtn = document.getElementById('voice-toggle-btn');
        console.log('[Setup] Language selector found:', !!langSelector);
        console.log('[Setup] Voice button found:', !!voiceBtn);

        // ===== LANGUAGE SWITCHING =====
        if (langSelector) {
            langSelector.addEventListener('change', (e) => {
                currentLanguage = e.target.value;
                localStorage.setItem('rescueAid_language', currentLanguage);
                
                // Update voice recognition language
                if (recognizer) {
                    recognizer.lang = currentLanguage === 'es' ? 'es-ES' : 
                                      currentLanguage === 'fr' ? 'fr-FR' : 
                                      currentLanguage === 'de' ? 'de-DE' : 
                                      currentLanguage === 'pt' ? 'pt-PT' :
                                      currentLanguage === 'hi' ? 'hi-IN' :
                                      currentLanguage === 'ta' ? 'ta-IN' :
                                      currentLanguage === 'te' ? 'te-IN' :
                                      currentLanguage === 'bn' ? 'bn-IN' : 'en-US';
                }
                
                initializeUI();
                if (decisionTree) {
                    renderHome();
                    // If we're on a question screen, re-render the current node
                    if (currentNodeId && currentNodeId !== 'home') {
                        renderNode();
                    }
                }
            });
        }

        // ===== VOICE CONTROL =====
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (!recognizer) {
                    alert('Voice control not supported in this browser');
                    return;
                }
                voiceControlEnabled = !voiceControlEnabled;
                localStorage.setItem('rescueAid_voiceControl', voiceControlEnabled);
                updateVoiceButton();
            });
        }

        // ===== DISCLAIMER HANDLING =====
        const disclaimer = document.getElementById('disclaimer-modal');
        if (!localStorage.getItem('rescueAid_disclaimer_accepted')) {
            disclaimer.style.display = 'flex';
        } else {
            disclaimer.style.display = 'none';
        }

        document.getElementById('accept-disclaimer').addEventListener('click', () => {
            localStorage.setItem('rescueAid_disclaimer_accepted', 'true');
            disclaimer.style.display = 'none';
        });

        // ===== YES/NO BUTTONS =====
        document.getElementById('btn-yes').addEventListener('click', () => {
            currentNodeId = decisionTree.nodes[currentNodeId].yes;
            renderNode();
        });

        document.getElementById('btn-no').addEventListener('click', () => {
            currentNodeId = decisionTree.nodes[currentNodeId].no;
            renderNode();
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            resetSeverity();
            switchScreen(screenQuestion, screenHome);
            renderHome();
            if (voiceControlEnabled) startListening();
        });

        document.getElementById('btn-done').addEventListener('click', () => {
            resetSeverity();
            switchScreen(screenQuestion, screenHome);
            renderHome();
            if (voiceControlEnabled) startListening();
        });
    }

    // ===== VOICE CONTROL =====
    function updateVoiceButton() {
        const btn = document.getElementById('voice-toggle-btn');
        if (voiceControlEnabled) {
            btn.classList.add('active');
            btn.innerText = t('voiceEnabled');
            startListening();
        } else {
            btn.classList.remove('active');
            btn.innerText = t('voiceDisabled');
            stopListening();
        }
    }

    function startListening() {
        if (!recognizer || !voiceControlEnabled) return;
        
        try {
            recognizer.start();
            console.log('[Voice] Listening activated');
        } catch (e) {
            console.log('[Voice] Already listening or error:', e);
        }
    }

    function stopListening() {
        if (!recognizer) return;
        try {
            recognizer.stop();
        } catch (e) {
            console.log('[Voice] Stop listening error:', e);
        }
    }

    recognizer?.addEventListener('result', (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('')
            .toUpperCase();

        console.log('[Voice] Heard:', transcript);

        // Handle voice commands in all languages
        const yesKeywords = {
            'en': ['YES', 'CORRECT'],
            'es': ['SÍ', 'CORRECTO'],
            'fr': ['OUI', 'CORRECT'],
            'de': ['JA', 'KORREKT'],
            'pt': ['SIM', 'CORRETO'],
            'hi': ['हाँ', 'सही'],
            'ta': ['ஆம்', 'சரி'],
            'te': ['అవును', 'సరైనది'],
            'bn': ['হ্যাঁ', 'সঠিক']
        };

        const noKeywords = {
            'en': ['NO', 'INCORRECT'],
            'es': ['NO', 'INCORRECTO'],
            'fr': ['NON', 'INCORRECT'],
            'de': ['NEIN', 'FALSCH'],
            'pt': ['NÃO', 'INCORRETO'],
            'hi': ['नहीं', 'गलत'],
            'ta': ['இல்லை', 'தவறு'],
            'te': ['లేదు', 'తప్పు'],
            'bn': ['না', 'ভুল']
        };

        // Check if spoken word matches YES keywords
        if (yesKeywords[currentLanguage]?.some(keyword => transcript.includes(keyword))) {
            document.getElementById('btn-yes').click();
        }
        // Check if spoken word matches NO keywords
        else if (noKeywords[currentLanguage]?.some(keyword => transcript.includes(keyword))) {
            document.getElementById('btn-no').click();
        }

        startListening(); // Restart listening
    });

    recognizer?.addEventListener('end', () => {
        if (voiceControlEnabled) {
            startListening();
        }
    });

    // ===== DISCLAIMER HANDLING =====
    const disclaimer = document.getElementById('disclaimer-modal');
    if (!localStorage.getItem('rescueAid_disclaimer_accepted')) {
        disclaimer.style.display = 'flex';
    } else {
        disclaimer.style.display = 'none';
    }

    // ===== DECISION TREE LOGIC =====
    let currentNodeId = null;
    let severityScore = 0;
    let severityLevel = 'low'; // 'low', 'medium', 'high', 'critical'
    let criticalFlag = false;
    let currentConditionId = null;

    // UI Elements
    const screenHome = document.getElementById('screen-home');
    const screenQuestion = document.getElementById('screen-question');
    const conditionGrid = document.getElementById('condition-grid');
    const promptText = document.getElementById('prompt-text');
    const actionButtons = document.getElementById('action-buttons');
    const endButtons = document.getElementById('end-buttons');
    const voiceStatus = document.getElementById('voice-status');
    const voiceStatusText = document.getElementById('voice-status-text');
    const voiceHint = document.getElementById('voice-hint');
    const voiceHintText = document.getElementById('voice-hint-text');

    // Severity Tracking Function
    function trackSeverity(nodeId) {
        const node = decisionTree.nodes[nodeId];
        if (!node) return;

        // Check if this node is marked as critical
        if (node.severity === 'critical') {
            criticalFlag = true;
            severityLevel = 'critical';
            severityScore = 100;
            showEmergencyAlert('critical', nodeId);
            return;
        }

        // Track severity based on node progression
        if (node.type === 'i') { // Instruction node
            const text = node.text.toLowerCase();
            if (text.includes('🚨') || text.includes('critical') || text.includes('call 112') || text.includes('tlama 112') || text.includes('appelez 112')) {
                if (severityLevel !== 'critical') {
                    severityLevel = 'high';
                    severityScore = Math.max(severityScore, 80);
                    if (text.includes('call 112') || text.includes('immediately') || text.includes('immédiatement')) {
                        showEmergencyAlert('high', nodeId);
                    }
                }
            } else if (text.includes('monitor') || text.includes('gentle')) {
                severityLevel = 'low';
                severityScore = Math.min(severityScore, 30);
            }
        }
    }

    // Emergency Alert Function
    function showEmergencyAlert(severity, nodeId) {
        const node = decisionTree.nodes[nodeId];
        if (!node) return;

        // Create or update emergency alert element
        let alertBox = document.getElementById('emergency-alert-box');
        if (!alertBox) {
            alertBox = document.createElement('div');
            alertBox.id = 'emergency-alert-box';
            alertBox.className = `emergency-alert severity-${severity}`;
            document.querySelector('main').insertBefore(alertBox, screenQuestion);
        }

        const severityText = severity === 'critical' ? '🚨 CRITICAL EMERGENCY' : '⚠️ HIGH SEVERITY';
        const callText = languages[currentLanguage]?.ui?.emergency || 'CALL 112';

        alertBox.innerHTML = `
            <div class="alert-content">
                <h3>${severityText}</h3>
                <p>Immediate medical attention required</p>
                <a href="tel:112" class="alert-call-btn">📞 ${callText}</a>
                <p class="alert-note">Stay on the line with emergency services</p>
            </div>
        `;
        alertBox.style.display = 'block';
    }

    function hideEmergencyAlert() {
        const alertBox = document.getElementById('emergency-alert-box');
        if (alertBox) {
            alertBox.style.display = 'none';
        }
    }

    function resetSeverity() {
        severityScore = 0;
        severityLevel = 'low';
        criticalFlag = false;
        hideEmergencyAlert();
    }

    // Load Decision Tree Data with offline fallback
    function loadTreeData() {
        return Promise.all([
            fetch('/static/data/tree.json').then(r => r.json()),
            fetch('/static/data/node-translations.json').then(r => r.json()).catch(e => {
                console.log('[Offline] Node translations not available:', e);
                return {};
            })
        ]).then(([tree, translations]) => {
            decisionTree = tree;
            nodeTranslations = translations;
            console.log('[Offline] Decision tree and translations loaded successfully');
            renderHome();
        }).catch(err => {
            console.log('[Offline] Network failed for tree, trying cache...');
            if ('caches' in window) {
                return Promise.all([
                    caches.match('/static/data/tree.json').then(r => r ? r.json() : null),
                    caches.match('/static/data/node-translations.json').then(r => r ? r.json() : {})
                ]).then(([tree, translations]) => {
                    if (tree) {
                        decisionTree = tree;
                        nodeTranslations = translations || {};
                        console.log('[Offline] Decision tree loaded from cache');
                        renderHome();
                    } else {
                        console.error('[Offline] No cached decision tree available');
                        alert('Unable to load emergency data. Please connect to internet.');
                    }
                });
            }
        });
    }

    // Render Home Screen Grid
    function renderHome() {
        conditionGrid.innerHTML = '';
        decisionTree.conditions.forEach(cond => {
            const card = document.createElement('div');
            card.className = 'condition-card';
            // Translate condition name based on current language
            const translatedName = nodeTranslations[cond.id] ? 
                (nodeTranslations[cond.id][currentLanguage] || cond.name) : cond.name;
            card.innerText = translatedName;
            card.onclick = () => startEmergency(cond.id);
            conditionGrid.appendChild(card);
        });
        
        if (voiceControlEnabled) {
            voiceStatus.classList.remove('hidden');
            voiceStatusText.innerText = t('listening');
        }
    }

    // Helper to get translated node text
    function getNodeText(nodeId, fallbackText) {
        if (nodeTranslations[nodeId] && nodeTranslations[nodeId][currentLanguage]) {
            return nodeTranslations[nodeId][currentLanguage];
        }
        return fallbackText;
    }

    // Start Emergency Flow
    function startEmergency(conditionId) {
        currentConditionId = conditionId;
        currentNodeId = `${conditionId}_start`;
        resetSeverity(); // Reset severity for new condition
        switchScreen(screenHome, screenQuestion);
        renderNode();
    }

    // Render Current Node
    function renderNode() {
        const node = decisionTree.nodes[currentNodeId];
        if (!node) return;

        // Track severity based on node properties
        trackSeverity(currentNodeId);

        // Use translated text if available, otherwise use English
        promptText.innerText = getNodeText(currentNodeId, node.text);

        // Update severity indicator
        const severityIndicator = document.getElementById('severity-indicator');
        const severityText = document.getElementById('severity-text');
        
        if (severityLevel !== 'low' && criticalFlag) {
            severityIndicator.classList.remove('hidden');
            severityIndicator.className = `severity-indicator severity-${severityLevel}`;
            severityText.innerText = languages[currentLanguage]?.ui?.severityCritical || '🚨 CRITICAL - EMERGENCY SERVICES REQUIRED';
        } else if (severityLevel === 'high') {
            severityIndicator.classList.remove('hidden');
            severityIndicator.className = `severity-indicator severity-${severityLevel}`;
            severityText.innerText = languages[currentLanguage]?.ui?.severityHigh || '⚠️ SEVERITY: HIGH - Medical attention needed';
        } else if (severityLevel === 'medium') {
            severityIndicator.classList.remove('hidden');
            severityIndicator.className = `severity-indicator severity-${severityLevel}`;
            severityText.innerText = languages[currentLanguage]?.ui?.severityMedium || 'SEVERITY: MEDIUM - Monitor closely';
        } else {
            severityIndicator.classList.add('hidden');
        }

        if (node.type === 'q') {
            // It's a question
            actionButtons.classList.remove('hidden');
            endButtons.classList.add('hidden');
            
            if (voiceControlEnabled) {
                voiceStatus.classList.remove('hidden');
                voiceStatusText.innerText = t('listening');
                voiceHint.classList.remove('hidden');
                voiceHintText.innerText = t('voiceYes') + ' / ' + t('voiceNo');
                startListening();
            } else {
                voiceStatus.classList.add('hidden');
                voiceHint.classList.add('hidden');
            }
        } else {
            // It's a final instruction
            actionButtons.classList.add('hidden');
            endButtons.classList.remove('hidden');
            voiceStatus.classList.add('hidden');
            voiceHint.classList.add('hidden');
        }
    }

    // Event Listeners
    document.getElementById('btn-yes').addEventListener('click', () => {
        currentNodeId = decisionTree.nodes[currentNodeId].yes;
        renderNode();
    });

    function switchScreen(hideElement, showElement) {
        hideElement.classList.remove('active');
        hideElement.classList.add('hidden');
        showElement.classList.remove('hidden');
        showElement.classList.add('active');
    }

    // ===== SERVICE WORKER REGISTRATION =====
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(registration => {
                console.log('✓ Service Worker registered successfully');
                console.log('✓ Offline support enabled - App can work without internet');
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000);
            })
            .catch(err => {
                console.error('✗ Service Worker registration failed:', err);
            });
    } else {
        console.warn('Service Worker not supported in this browser');
    }
});