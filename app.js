// ========================================================
// Supabase 設定、全域狀態與共用函數
// ========================================================
const SUPABASE_URL = "https://hqjqnbzzrduhdiwaxoxp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-xqiL_LXkK2pWt5UopJ5Nw__OxyEmOH";
let supabaseClient = null;

// 使用者與社交狀態
let currentUser = null;
let myProfile = null;
let friendsList = [];
let connectionsList = [];
let userMessages = [];

// 好友檢視與狀態標記
let isViewingFriend = false;
let friendState = null;
let viewingFriendId = null;
let showIntersection = false;
let currentReadingNoteId = null;

// 儲存狀態標記
let isSaving = false;
let pendingSave = false; // 新增佇列標記

// UI 與編輯狀態管理
let currentEditingSlot = null; // 單節編輯用
let isMultiSelectMode = false; // 判斷是否為 +課程(多選模式)
let currentEditingTutoringId = null;
let currentEditingWorkId = null;
let currentEditingBillingIndex = null;
let currentEditingWorkBillingIndex = null;
let currentViewingOverrideId = null;
let currentViewingTempEventId = null;
let currentEditingOverrideId = null;
let currentEditingTempEventId = null;
let currentWeekOffset = 0;
let currentSelectedStudentFilter = "__FILTER_ALL__";
let currentBillingType = "tutoring";

// 財務圖表與分類狀態
let financeActiveMode = "all";
let financeActiveMainCat = "all";
let financeActiveSubCat = "all";
let isExpenseChartVisible = false;
let activeCatTask = { type: "", pCat: "", sIdx: "" };
let tempDeadlines = [];
let currentEditingDeadlineIdx = null;

// [修復] Toast 通知計時器覆蓋問題
let toastTimeout = null;

// 自動調整 textarea 高度
document.addEventListener('input', function(e) {
    if (e.target.tagName.toLowerCase() === 'textarea') {
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';
    }
});

// 初始化 Supabase
if (typeof supabase !== 'undefined' && SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 5) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Supabase SDK 未載入或設定不正確。");
}

// 阻擋未儲存離開
window.addEventListener('beforeunload', (e) => {
    if (isSaving) {
        e.preventDefault();
        e.returnValue = '資料正在儲存中，確定要離開嗎？';
    }
});

// [修復] 防止連續觸發造成的 Race Condition 導致通知瞬間消失
function showToast(message, type = 'success') {
    const toast = document.getElementById('global-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    
    toastTimeout = setTimeout(() => { 
        toast.classList.add('hidden'); 
    }, 3000);
}

// 觸覺回饋
function triggerHaptic(duration = 20) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

//OneSignal
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "edb6227b-ecdb-4a1c-b116-1b1bbd1bbf86",
    notifyButton: {
      enable: true,
    },
    // 加入這兩行，指定使用你的 sw.js
    serviceWorkerParam: { scope: "/" },
    serviceWorkerPath: "sw.js" 
  });
});

// ========================================================
// 預設資料與主題配置
// ========================================================
const THEME_OPTIONS = {
    light: [
        { id: "light-swiss-blue", name: "1. 瑞士極簡蔚藍" },
        { id: "light-sage-mist", name: "2. 鼠尾草晨霧綠" },
        { id: "light-cream-oat", name: "3. 奶油燕麥暖棕" },
        { id: "light-nord-pastel", name: "4. 北歐粉彩晨曦" },
        { id: "light-raspberry", name: "5. 櫻桃木覆盆子" },
        { id: "light-mint-aqua", name: "6. 薄荷海鹽沁藍" },
        { id: "light-lavender", name: "7. 法式薰衣草紫" },
        { id: "light-sunset-gold", name: "8. 加州暖陽夕陽橘" },
        { id: "light-morandi", name: "9. 莫蘭迪石英灰" },
        { id: "light-champagne", name: "10. 頂級香檳金" },
        { id: "light-mediterranean", name: "11. 地中海群青" },
        { id: "light-matcha", name: "12. 京都抹茶焙茶" },
        { id: "light-apricot", name: "13. 甜杏馬卡龍" },
        { id: "light-editorial", name: "14. 出版雜誌黑白" },
        { id: "light-iced-latte", name: "15. 淺焙冰滴拿鐵" }
    ],
    dark: [
        { id: "dark-tokyo-night", name: "1. 東京暗夜極光" },
        { id: "dark-dracula", name: "2. 吸血鬼傳說" },
        { id: "dark-nord", name: "3. 北歐極光灰藍" },
        { id: "dark-catppuccin", name: "4. 貓咪摩卡深棕" },
        { id: "dark-cyberpunk", name: "5. 賽博龐克霓虹" },
        { id: "dark-gruvbox", name: "6. 復古暖調" },
        { id: "dark-nebula", name: "7. 深空星雲紫" },
        { id: "dark-forest", name: "8. 森林暗夜松綠" },
        { id: "dark-matrix", name: "9. 黑客矩陣綠" },
        { id: "dark-crimson", name: "10. 黑曜石血石紅" },
        { id: "dark-cobalt", name: "11. 暮光深海鈷藍" },
        { id: "dark-amber", name: "12. 暖夜復古琥珀" },
        { id: "dark-oled", name: "13. OLED 純黑單色" },
        { id: "dark-rose-pine", name: "14. 暮色玫瑰金" },
        { id: "dark-solarized", name: "15. 太陽能微光" }
    ]
};

const initialDefaultPeriods = [
    { id: 1, name: "第一節", start: "08:10", end: "09:00" },
    { id: 2, name: "第二節", start: "09:10", end: "10:00" },
    { id: 3, name: "第三節", start: "10:10", end: "11:00" },
    { id: 4, name: "第四節", start: "11:10", end: "12:00" },
    { id: 5, name: "第五節", start: "13:10", end: "14:00" },
    { id: 6, name: "第六節", start: "14:10", end: "15:00" },
    { id: 7, name: "第七節", start: "15:10", end: "16:00" },
    { id: 8, name: "第八節", start: "16:10", end: "17:00" },
    { id: 9, name: "第九節", start: "17:10", end: "18:00", optional: true },
    { id: 10, name: "第十節", start: "18:10", end: "19:00", optional: true }
];

const DEFAULT_CATEGORIES = {
    expense: {
        "🍽️ 飲食": ["早餐", "午餐", "晚餐", "飲料零食", "外食聚餐", "食材買菜"],
        "🚗 交通": ["大眾運輸", "計程車", "油錢", "停車費", "維修保養"],
        "🛍️ 購物": ["服飾配件", "日用品", "3C科技", "美妝保養"],
        "🎉 娛樂": ["電影展覽", "旅遊度假", "手遊課金", "運動健身"],
        "🏠 居住": ["房租房貸", "水電瓦斯", "管理費", "家具家電"],
        "📚 教育": ["書籍雜誌", "線上課程", "學費考試"],
        "💊 醫療": ["門診藥品", "保險費", "體檢"],
        "📦 其他": ["還款", "其他支出"]
    },
    income: {
        "💰 工作收入": ["本業薪資", "家教收入", "兼職外快", "獎金紅利"],
        "📈 理財收入": ["股息股利", "利息收入", "投資變現"],
        "🧧 其他收入": ["中獎發票", "禮金紅包", "還款", "其他"]
    },
    transfer: { "🔄 帳戶轉帳": ["銀行互轉", "提款", "存款"] },
    receivable: { "📥 應收款項": ["代墊款項", "借出款項", "未結薪資"] },
    payable: { "📤 應付款項": ["刷卡應付", "跟人借款"] }
};

const CELL_HEIGHT = 57;

// 建立應用程式預設狀態
function createDefaultState() {
    const dId = "sch_" + Date.now();
    return {
        themeMode: "light",
        peekCounts: {},
        themeStyle: "light-swiss-blue",
        fontFamily: "default",
        lastLightStyle: "light-swiss-blue",
        lastDarkStyle: "dark-tokyo-night",
        showLatePeriods: false,
        showTutoring: false,
        showDeadlines: true,
        textAlign: "center",
        is24HourMode: false,
        billings: [], 
        workBillings: [], 
        finances: [], 
        recurringFinances: [],
        customCategories: null, 
        categoryOrder: null, 
        showHiddenItems: false,
        activeScheduleId: dId,
        schedules: [{
            id: dId, 
            title: "115學年度上學期課表", 
            startDate: "2026-09-07", 
            endDate: "2027-01-10",
            periods: structuredClone(initialDefaultPeriods),
            courses: {}, 
            tutorings: [], 
            works: [], 
            overrides: [], 
            temporaryEvents: [], 
            weeklyMemos: {}
        }],
        // 👇 新增學分計算機預設結構 👇
        credits: {
            targetTotal: 0,
            targets: { "系必修": 0, "系選修": 0, "通識": 0, "共同必修": 0, "自由選修": 0 },
            semesterOrder: ["大一上", "大一下", "大二上", "大二下", "大三上", "大三下", "大四上", "大四下"],
            semesters: { "大一上": [], "大一下": [], "大二上": [], "大二下": [], "大三上": [], "大三下": [], "大四上": [], "大四下": [] }
        }
    };
}

let state = createDefaultState();

// ========================================================
// 工具與資料函數
// ========================================================

// 自訂確認對話框
window.showConfirm = function(msg, onConfirm, okText="確定", isDanger=true, hideCancel=false, hideTitle=false, okBtnClass="") {
    document.getElementById("confirm-modal-message").innerText = msg;
    
    const okBtn = document.getElementById("confirm-btn-ok");
    okBtn.innerText = okText;
    
    // 若有傳入自訂 class，則覆蓋預設的紅/橘色樣式
    if (okBtnClass) {
        okBtn.className = okBtnClass;
    } else {
        okBtn.className = isDanger ? "btn btn-danger" : "btn btn-warning";
    }
    
    okBtn.onclick = () => {
        closeModal("custom-confirm-modal");
        if (onConfirm) {
            onConfirm();
        }
    };
    
    const titleEl = document.getElementById("confirm-modal-title");
    if (titleEl) {
        titleEl.style.display = hideTitle ? "none" : "block";
        titleEl.innerText = "確認操作";
    }
    
    const cancelBtn = document.querySelector("#custom-confirm-modal .btn-secondary");
    if (cancelBtn) {
        cancelBtn.style.display = hideCancel ? "none" : "inline-flex";
    }

    document.getElementById("custom-confirm-modal").classList.add("active");
};

// 獲取目標課表 (包含檢視好友時的判斷)
function getTargetSchedule() {
    let targetState = (isViewingFriend && friendState) ? friendState : state;
    
    if (!targetState.schedules || targetState.schedules.length === 0) {
        return { 
            id: "empty", 
            periods: initialDefaultPeriods, 
            courses: {}, 
            tutorings: [], 
            works: [], 
            overrides: [], 
            temporaryEvents: [], 
            weeklyMemos: {} 
        };
    }
    
    let sch = targetState.schedules.find((s) => s.id === targetState.activeScheduleId) || targetState.schedules[0];
    
    // 確保各項陣列/物件存在
    sch.courses = sch.courses || {};
    sch.tutorings = sch.tutorings || [];
    sch.works = sch.works || [];
    sch.overrides = sch.overrides || [];
    sch.temporaryEvents = sch.temporaryEvents || [];
    sch.weeklyMemos = sch.weeklyMemos || {};
    sch.periods = sch.periods || structuredClone(initialDefaultPeriods);
    
    return sch;
}

function getActiveSchedule() { 
    return getTargetSchedule(); 
}

// 獲取分類清單
function getCategories() {
    if (!state.customCategories) {
        state.customCategories = structuredClone(DEFAULT_CATEGORIES);
    }
    return state.customCategories;
}

// 獲取各分類的排序鍵值
function getCategoryKeys(type) {
    const cats = getCategories();
    
    if (!state.categoryOrder) {
        state.categoryOrder = {};
    }
    
    if (!state.categoryOrder[type]) {
        state.categoryOrder[type] = Object.keys(cats[type] || {});
    }
    
    const currentKeys = Object.keys(cats[type] || {});
    state.categoryOrder[type] = state.categoryOrder[type].filter(k => currentKeys.includes(k));
    
    currentKeys.forEach(k => { 
        if (!state.categoryOrder[type].includes(k)) {
            state.categoryOrder[type].push(k); 
        }
    });
    
    return state.categoryOrder[type];
}

// 日期解析
function parseLocalDate(dateStr) { 
    return dateStr ? new Date(dateStr.replace(/-/g, '/')) : new Date(); 
}

// 時間字串轉成分鐘數
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}

// 計算時間對應的像素偏移 (課表繪製用)
function timeToPixelOffset(timeMins, periods, hasNoon = false) {
    if (!periods || periods.length === 0) return 0;
    
    const firstStart = timeToMinutes(periods[0].start);
    if (timeMins <= firstStart) return 0;
    
    for (let i = 0; i < periods.length; i++) {
        const pStart = timeToMinutes(periods[i].start);
        const pEnd = timeToMinutes(periods[i].end);
        let currentNoonOffset = (hasNoon && periods[i].id >= 5) ? CELL_HEIGHT : 0;
        
        // 如果時間落在節次內
        if (timeMins >= pStart && timeMins <= pEnd) {
            return i * CELL_HEIGHT + currentNoonOffset + ((timeMins - pStart) / (pEnd - pStart || 1)) * CELL_HEIGHT;
        }
        
        // 如果時間落在兩堂課的「空檔/中午」之間 (按比例計算像素)
        if (i < periods.length - 1) {
            const nextStart = timeToMinutes(periods[i + 1].start);
            if (timeMins > pEnd && timeMins < nextStart) {
                let gapStartPx = (i + 1) * CELL_HEIGHT + currentNoonOffset;
                let nextNoonOffset = (hasNoon && periods[i + 1].id >= 5) ? CELL_HEIGHT : 0;
                let gapEndPx = (i + 1) * CELL_HEIGHT + nextNoonOffset;
                
                let ratio = (nextStart === pEnd) ? 0 : (timeMins - pEnd) / (nextStart - pEnd);
                return gapStartPx + ratio * (gapEndPx - gapStartPx);
            }
        }
    }
    
    return periods.length * CELL_HEIGHT + (hasNoon ? CELL_HEIGHT : 0);
}

// 取得 CSS 變數顏色與色碼轉換
function getComputedThemeColor(varName) { 
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); 
}

function getDefaultSchoolBgHex() { 
    return rgbToHex(getComputedThemeColor("--school-def-bg")) || "#e0f2fe"; 
}

function getDefaultTutoringBgHex() { 
    return rgbToHex(getComputedThemeColor("--tutoring-def-bg")) || "#fef3c7"; 
}

function getDefaultWorkBgHex() { 
    return getDefaultTutoringBgHex(); 
}

function rgbToHex(rgbStr) {
    if (!rgbStr || rgbStr.startsWith("#")) return rgbStr;
    const match = rgbStr.match(/\d+/g);
    if (!match || match.length < 3) return null;
    return "#" + ((1 << 24) + (Number(match[0]) << 16) + (Number(match[1]) << 8) + Number(match[2])).toString(16).slice(1);
}

// 根據背景色計算對比文字顏色
function getTextColorForBg(hexColor) {
    if (!hexColor || !hexColor.startsWith("#")) return "var(--text)";
    let hex = hexColor.replace("#", "");
    if (hex.length === 3) {
        hex = hex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return ((r * 299 + g * 587 + b * 114) / 1000) >= 130 ? "#0f172a" : "#ffffff";
}

// 防止 XSS 與特殊字元轉義
function escapeHtml(text) { 
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"); 
}

function escapeJS(text) { 
    return String(text || "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "\\\""); 
}

function escapeHtmlWithBr(text) { 
    return escapeHtml(text).replace(/\n/g, "<br>"); 
}
// ========================================================
// 認證與雲端同步
// ========================================================

// 檢查使用者登入狀態與載入雲端資料
async function checkAuthSession() {
    if (!supabaseClient) { 
        document.getElementById("sync-user-text").innerText = "本機模式"; 
        return; 
    }
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session && session.user) {
            currentUser = session.user;
            updateUserUI(true, currentUser.email);
            
            await fetchMyProfile();
            await fetchConnections();
            await pullCloudData();
            await fetchMessages();
        } else {
            updateUserUI(false);
        }
    } catch (e) { 
        console.error("Session check failed:", e); 
    }
}

// 更新使用者介面登入狀態
function updateUserUI(isLoggedIn, email = "") {
    const dot = document.getElementById("sync-dot");
    const text = document.getElementById("sync-user-text");
    const btn = document.getElementById("btn-auth-action");
    text.style.color = "inherit";
    
    if (isLoggedIn) {
        dot.className = "status-dot online";
        text.innerText = `已登入: ${email}`;
        btn.innerText = "登出";
        btn.onclick = handleAuthLogout;
    } else {
        dot.className = "status-dot";
        text.innerText = "未登入";
        btn.innerText = "登入/註冊";
        btn.onclick = openAuthModal;
        
        const nicknameDisplay = document.getElementById("settings-nickname-display");
        if (nicknameDisplay) nicknameDisplay.innerText = "未登入";
        
        const topNickname = document.getElementById("my-nickname-display");
        if (topNickname) topNickname.innerText = "未登入";
    }
}

// 取得個人檔案與暱稱
async function fetchMyProfile() {
    try {
        const { data } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
        if (data) {
            myProfile = data;
            const nm = data.nickname ? `(${data.nickname})` : "(設定暱稱)";
            
            if (document.getElementById("my-nickname-display")) {
                document.getElementById("my-nickname-display").innerText = nm;
            }
            if (document.getElementById("settings-nickname-display")) {
                document.getElementById("settings-nickname-display").innerText = data.nickname || "(設定暱稱)";
            }
        } else {
            await supabaseClient.from('profiles').insert({ id: currentUser.id, email: currentUser.email });
            myProfile = { id: currentUser.id, email: currentUser.email };
            
            if (document.getElementById("my-nickname-display")) {
                document.getElementById("my-nickname-display").innerText = "(設定暱稱)";
            }
            if (document.getElementById("settings-nickname-display")) {
                document.getElementById("settings-nickname-display").innerText = "(設定暱稱)";
            }
        }
    } catch (e) { 
        console.error("Fetch profile failed:", e); 
    }
}

// 開啟暱稱設定視窗
function openNicknameModal() {
    document.getElementById("my-nickname-input").value = myProfile?.nickname || "";
    document.getElementById("nickname-msg").innerText = "";
    document.getElementById("nickname-modal").classList.add("active");
}

// 儲存修改後的暱稱
async function saveNickname() {
    const nn = document.getElementById("my-nickname-input").value.trim();
    if (!nn) return;
    
    try {
        const { data: existing } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('nickname', nn)
            .single();
            
        if (existing && existing.id !== currentUser.id) {
            document.getElementById("nickname-msg").innerText = "此暱稱已被使用，請換一個";
            return;
        }
        
        const { error } = await supabaseClient
            .from('profiles')
            .update({ nickname: nn })
            .eq('id', currentUser.id);
            
        if (error) {
            document.getElementById("nickname-msg").innerText = error.message;
        } else {
            myProfile.nickname = nn;
            if (document.getElementById("my-nickname-display")) {
                document.getElementById("my-nickname-display").innerText = `(${nn})`;
            }
            if (document.getElementById("settings-nickname-display")) {
                document.getElementById("settings-nickname-display").innerText = nn;
            }
            closeModal("nickname-modal");
            showToast("暱稱已更新");
        }
    } catch (err) {
        console.error(err);
    }
}

// ========================================================
// 社交與好友功能
// ========================================================

// 搜尋好友
async function searchFriends() {
    const q = document.getElementById("friend-search-input").value.trim();
    if (!q) return;
    
    try {
        const { data } = await supabaseClient
            .from('profiles')
            .select('*')
            .or(`email.eq.${q},nickname.eq.${q}`);
            
        const res = document.getElementById("friend-search-result");
        
        if (data && data.length > 0) {
            const p = data[0];
            if (p.id === currentUser.id) { 
                res.innerHTML = "這是你自己。"; 
                return; 
            }
            
            const isConn = connectionsList.find(c => c.requester_id === p.id || c.receiver_id === p.id);
            if (isConn) { 
                res.innerHTML = `已存在連線狀態：${escapeHtml(p.nickname || p.email)} (${isConn.status})`; 
                return; 
            }
            
            res.innerHTML = `找到用戶：${escapeHtml(p.nickname || p.email)} 
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem; margin-left:8px;" 
                                     onclick="sendFriendRequest('${p.id}')">送出邀請</button>`;
        } else {
            res.innerHTML = "找不到此用戶。";
        }
    } catch (err) { 
        console.error(err); 
    }
}

// 發送好友邀請
async function sendFriendRequest(fid) {
    try {
        await supabaseClient.from('connections').insert({ requester_id: currentUser.id, receiver_id: fid });
        document.getElementById("friend-search-result").innerHTML = "邀請已發送！";
        fetchConnections();
    } catch (err) { 
        console.error(err); 
    }
}

// 取得好友連線列表
async function fetchConnections() {
    if (!currentUser) return;
    try {
        const { data: rawConns } = await supabaseClient
            .from('connections')
            .select('*')
            .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
            
        if (rawConns && rawConns.length > 0) {
            const ids = new Set();
            rawConns.forEach(c => { 
                ids.add(c.requester_id); 
                ids.add(c.receiver_id); 
            });
            
            const { data: profs } = await supabaseClient
                .from('profiles')
                .select('*')
                .in('id', Array.from(ids));
            
            connectionsList = rawConns.map(c => {
                return {
                    ...c,
                    requester: (profs || []).find(p => p.id === c.requester_id) || { id: c.requester_id, nickname: '未知好友' },
                    receiver: (profs || []).find(p => p.id === c.receiver_id) || { id: c.receiver_id, nickname: '未知好友' }
                };
            });
        } else { 
            connectionsList = []; 
        }
    } catch (err) { 
        console.error(err); 
    }
    
    renderFriendsView();
    if (typeof populateFriendSelects === 'function') {
        populateFriendSelects();
    }
}

// 接受與拒絕好友邀請
async function acceptReq(cid) { 
    await supabaseClient.from('connections').update({status:'accepted'}).eq('id',cid); 
    fetchConnections(); 
}

async function rejectReq(cid) { 
    await supabaseClient.from('connections').update({status:'rejected'}).eq('id',cid); 
    fetchConnections(); 
}

// 渲染好友畫面
function renderFriendsView() {
    const flist = document.getElementById("friends-list");
    const rlist = document.getElementById("friends-requests-list");
    if (!flist || !rlist) return;
    
    flist.innerHTML = ""; 
    rlist.innerHTML = "";
    
    if (!currentUser) {
        flist.innerHTML = "<div style='font-size:0.75rem; color:var(--text-muted);'>請先登入以使用好友連線功能</div>";
        return;
    }
    
    const accepted = connectionsList.filter(c => c.status === 'accepted');
    if (accepted.length === 0) {
        flist.innerHTML = "<div style='font-size:0.75rem; color:var(--text-muted);'>尚未加入任何好友</div>";
    }
    
    accepted.forEach(c => {
        let friend = String(c.requester_id) === String(currentUser.id) ? c.receiver : c.requester;
        if (Array.isArray(friend)) friend = friend[0];
        
        if (friend) {
            flist.innerHTML += `
                <div class="friend-card" style="margin-bottom: 6px;">
                    <div class="friend-info">
                        <span class="friend-name">${escapeHtml(friend.nickname || friend.email)}</span>
                        <span class="friend-email">${friend.email || "無Email"}</span>
                    </div>
                    <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.7rem; border-radius:12px;" onclick="viewFriendSchedule('${friend.id}', '${escapeJS(friend.nickname || friend.email)}')">查看課表</button>
                </div>`;
        }
    });
    
    const pendingRec = connectionsList.filter(c => c.status === 'pending' && String(c.receiver_id) === String(currentUser.id));
    const pendingSent = connectionsList.filter(c => c.status === 'pending' && String(c.requester_id) === String(currentUser.id));
    
    if (pendingRec.length > 0) {
        pendingRec.forEach(c => {
            let req = Array.isArray(c.requester) ? c.requester[0] : c.requester;
            rlist.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border:1px solid #f59e0b; border-radius:6px; margin-bottom:4px;">
                    <span style="font-size:0.8rem;">${escapeHtml(req.nickname || req.email)} 發來邀請</span>
                    <div>
                        <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="rejectReq('${c.id}')">拒絕</button>
                        <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="acceptReq('${c.id}')">接受</button>
                    </div>
                </div>`;
        });
    }
    
    if (pendingSent.length > 0) {
        pendingSent.forEach(c => {
            let rec = Array.isArray(c.receiver) ? c.receiver[0] : c.receiver;
            rlist.innerHTML += `<div style="padding:8px; font-size:0.75rem; color:var(--text-muted);">等待 ${escapeHtml(rec.nickname || rec.email)} 接受...</div>`;
        });
    }
}

// ========================================================
// 通知與請求處理系統
// ========================================================

// 獲取並處理使用者通知訊息
async function fetchMessages() {
    if (!currentUser) return;
    try {
        const { data } = await supabaseClient
            .from('user_messages')
            .select(`*, sender:sender_id(nickname, email)`)
            .order('created_at', { ascending: false });
            
        if (data) {
            userMessages = data;
            let needsSave = false;
            
            for (let m of userMessages) {
                if (m.receiver_id === currentUser.id && m.status === 'unread') {
                    // 自動處理同意類的訊息
                    if (m.type === 'peek') {
                        if (!state.peekCounts) state.peekCounts = {};
                        const todayStr = formatDate(new Date());
                        
                        // 讀取目前的紀錄（兼容舊版純數字的防呆）
                        let currentRecord = state.peekCounts[m.sender_id];
                        if (typeof currentRecord !== 'object' || currentRecord === null) {
                            currentRecord = { count: 0, date: todayStr };
                        }
                        
                        // 判斷是否為今天，不是的話就重置為 1，是的話就 +1
                        if (currentRecord.date !== todayStr) {
                            currentRecord = { count: 1, date: todayStr };
                        } else {
                            currentRecord.count += 1;
                        }
                        
                        state.peekCounts[m.sender_id] = currentRecord;
                        
                        m.status = 'completed';
                        await supabaseClient.from('user_messages').update({ status: 'completed' }).eq('id', m.id);
                        needsSave = true;
                        continue;
                    }
                    if (m.type === 'request_accept') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId);
                        if (rec) rec.isPending = false;
                        
                        m.status = 'completed';
                        await supabaseClient.from('user_messages').update({ status: 'completed' }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'repay_accept') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId);
                        if (rec) {
                            rec.isPending = false;
                            const p = state.finances.find(f => f.id === rec.targetDebtId || (f.targetDebtId === rec.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                            if (p && p.remaining !== undefined) {
                                p.remaining = Math.round(p.remaining - rec.amount);
                            }
                        }
                        
                        m.status = 'completed';
                        await supabaseClient.from('user_messages').update({ status: 'completed' }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'delete_accept') {
                        const mainDebt = state.finances.find(f => 
                            (f.type === 'receivable' || f.type === 'payable') &&
                            (f.id === m.payload.sourceId || f.targetDebtId === m.payload.sourceId || 
                            (m.payload.targetDebtId && f.id === m.payload.targetDebtId) ||
                            (m.payload.targetDebtId && f.targetDebtId === m.payload.targetDebtId))
                        );
                        
                        if (mainDebt) {
                            const idsToRemove = new Set([mainDebt.id, m.payload.sourceId]);
                            if (mainDebt.targetDebtId) idsToRemove.add(mainDebt.targetDebtId);
                            if (m.payload.targetDebtId) idsToRemove.add(m.payload.targetDebtId);

                            state.finances = state.finances.filter(f => {
                                if (idsToRemove.has(f.id)) return false;
                                if (f.targetDebtId && idsToRemove.has(f.targetDebtId)) return false;
                                return true;
                            });
                        }
                        
                        m.type = 'notice'; 
                        m.payload.msg = `對方已同意刪除該筆連線紀錄！`;
                        await supabaseClient.from('user_messages').update({ type: 'notice', payload: m.payload }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'delete_repay_accept') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId || f.sharedId === m.payload.sourceId);
                        if (rec) {
                            const p = state.finances.find(f => f.id === rec.targetDebtId || (f.targetDebtId === rec.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                            if (p && p.remaining !== undefined) {
                                p.remaining = Math.round(p.remaining + rec.amount);
                            }
                            state.finances = state.finances.filter(f => f.id !== rec.id);
                        }
                        
                        m.type = 'notice'; 
                        m.payload.msg = `對方已同意刪除該筆還款紀錄！`;
                        await supabaseClient.from('user_messages').update({ type: 'notice', payload: m.payload }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'edit_accept') {
                        const p = state.finances.find(f => 
                            (f.type === 'receivable' || f.type === 'payable') &&
                            (f.id === m.payload.sourceId || f.targetDebtId === m.payload.sourceId || 
                            (m.payload.targetDebtId && f.id === m.payload.targetDebtId) ||
                            (m.payload.targetDebtId && f.targetDebtId === m.payload.targetDebtId))
                        );
                        if (p) {
                            const diff = Math.round(Number(m.payload.amount) - p.amount);
                            p.amount = Math.round(Number(m.payload.amount));
                            if (p.remaining !== undefined) {
                                p.remaining = Math.round(p.remaining + diff);
                            }
                            p.notes = m.payload.notes;
                        }
                        
                        m.type = 'notice'; 
                        m.payload.msg = `對方已同意修改紀錄為 $${m.payload.amount}！`;
                        await supabaseClient.from('user_messages').update({ type: 'notice', payload: m.payload }).eq('id', m.id);
                        needsSave = true;
                    }
                    else if (m.type === 'request_reject') {
                        const rec = state.finances.find(f => f.id === m.payload.sourceId);
                        if (rec && rec.isPending) {
                            state.finances = state.finances.filter(f => f.id !== m.payload.sourceId);
                        }
                        
                        m.type = 'notice';
                        await supabaseClient.from('user_messages').update({ type: 'notice' }).eq('id', m.id);
                        needsSave = true;
                    }
                }
            }
            
            if (needsSave) {
                saveToStorage();
                if (typeof renderFinances === 'function') renderFinances();
            }
            
            renderNotifications();
        }
    } catch (err) { 
        console.error("Fetch messages failed:", err); 
    }
}

// 回應對方發來的請求 (接受/拒絕)
window.respondRequest = async function(msgId, action) {
    const msg = userMessages.find(m => m.id === msgId);
    if (!msg) return;
    const senderId = msg.sender_id;

    try {
        if (action === 'accept') {
            if (msg.type === 'lend_request') {
                state.finances.unshift({
                    id: "fin_pay_" + Date.now(), 
                    date: formatDate(new Date()), 
                    type: "payable",
                    parentCat: "📤 應付款項", 
                    subCat: "跟人借款", 
                    amount: Math.round(Number(msg.payload.amount)),
                    remaining: Math.round(Number(msg.payload.amount)), 
                    notes: msg.payload.notes,
                    linkedFriendId: senderId, 
                    targetDebtId: msg.payload.sourceId, 
                    isPending: false, 
                    isHidden: false
                });
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'request_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已同意對方的紀錄！");
                
            } else if (msg.type === 'borrow_request') {
                state.finances.unshift({
                    id: "fin_rec_" + Date.now(), 
                    date: formatDate(new Date()), 
                    type: "receivable",
                    parentCat: "📥 應收款項", 
                    subCat: "代墊款項", 
                    amount: Math.round(Number(msg.payload.amount)),
                    remaining: Math.round(Number(msg.payload.amount)), 
                    notes: msg.payload.notes,
                    linkedFriendId: senderId, 
                    targetDebtId: msg.payload.sourceId, 
                    isPending: false, 
                    isHidden: false
                });
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'request_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已同意對方的紀錄！");
                
            } else if (msg.type === 'repay_request') {
                const parent = state.finances.find(f => f.id === msg.payload.targetDebtId || (f.targetDebtId === msg.payload.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                if (parent) {
                    parent.remaining = Math.round(parent.remaining - Number(msg.payload.amount));
                    state.finances.unshift({
                        id: "fin_rep_" + Date.now(), 
                        targetDebtId: parent.id, 
                        sharedId: msg.payload.sourceId,
                        date: formatDate(new Date()), 
                        type: parent.type === "receivable" ? "income" : "expense",
                        parentCat: parent.type === "receivable" ? "💰 工作收入" : "📦 其他", 
                        subCat: "還款",
                        amount: Math.round(Number(msg.payload.amount)), 
                        notes: msg.payload.notes, 
                        linkedFriendId: senderId, 
                        isPending: false, 
                        isHidden: false
                    });
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'repay_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已確認收款，雙方帳目已同步扣除！");
                
            } else if (msg.type === 'delete_request') {
                const mainDebt = state.finances.find(f => 
                    (f.type === 'receivable' || f.type === 'payable') &&
                    (f.id === msg.payload.sourceId || f.targetDebtId === msg.payload.sourceId || 
                    (msg.payload.targetDebtId && f.id === msg.payload.targetDebtId) ||
                    (msg.payload.targetDebtId && f.targetDebtId === msg.payload.targetDebtId))
                );
                
                if (mainDebt) {
                    const idsToRemove = new Set([mainDebt.id, msg.payload.sourceId]);
                    if (mainDebt.targetDebtId) idsToRemove.add(mainDebt.targetDebtId);
                    if (msg.payload.targetDebtId) idsToRemove.add(msg.payload.targetDebtId);

                    state.finances = state.finances.filter(f => {
                        if (idsToRemove.has(f.id)) return false;
                        if (f.targetDebtId && idsToRemove.has(f.targetDebtId)) return false;
                        return true;
                    });
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'delete_accept', payload: { sourceId: msg.payload.sourceId, targetDebtId: msg.payload.targetDebtId } });
                showToast("已同意並同步刪除雙方紀錄！");
                
            } else if (msg.type === 'delete_repay_request') {
                const rec = state.finances.find(f => f.id === msg.payload.sourceId || f.sharedId === msg.payload.sourceId);
                if (rec) {
                    const p = state.finances.find(f => f.id === rec.targetDebtId || (f.targetDebtId === rec.targetDebtId && (f.type === 'receivable' || f.type === 'payable')));
                    if (p && p.remaining !== undefined) {
                        p.remaining = Math.round(p.remaining + rec.amount);
                    }
                    state.finances = state.finances.filter(f => f.id !== rec.id);
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'delete_repay_accept', payload: { sourceId: msg.payload.sourceId } });
                showToast("已同意刪除該筆還款紀錄，雙方金額已回朔！");
                
            } else if (msg.type === 'edit_request') {
                const p = state.finances.find(f => 
                    (f.type === 'receivable' || f.type === 'payable') &&
                    (f.id === msg.payload.sourceId || f.targetDebtId === msg.payload.sourceId || 
                    (msg.payload.targetDebtId && f.id === msg.payload.targetDebtId) ||
                    (msg.payload.targetDebtId && f.targetDebtId === msg.payload.targetDebtId))
                );
                if (p) {
                    const diff = Math.round(Number(msg.payload.amount) - p.amount);
                    p.amount = Math.round(Number(msg.payload.amount));
                    if (p.remaining !== undefined) {
                        p.remaining = Math.round(p.remaining + diff);
                    }
                    p.notes = msg.payload.notes;
                }
                await supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: senderId, type: 'edit_accept', payload: { sourceId: msg.payload.sourceId, targetDebtId: msg.payload.targetDebtId, amount: msg.payload.amount, notes: msg.payload.notes } });
                showToast("已同意修改，雙方金額已同步更新！");
            }
        } else if (action === 'reject') {
            await supabaseClient.from('user_messages').insert({
                sender_id: currentUser.id, 
                receiver_id: senderId, 
                type: 'request_reject',
                payload: { sourceId: msg.payload.sourceId, msg: `對方拒絕了您的請求 (${msg.payload.amount ? '$'+msg.payload.amount : ''})` }
            });
            showToast("已拒絕該筆請求！");
        }

        // 標記通知為已處理
        msg.status = 'completed';
        await supabaseClient.from('user_messages').update({ status: 'completed' }).eq('id', msgId);
        
        saveToStorage(); 
        fetchMessages(); 
        if (typeof renderFinances === 'function') renderFinances();
        
    } catch (e) {
        console.error("回應請求失敗:", e);
        showToast("回應失敗，請重試", "error");
    }
};

// 渲染通知列表
function renderNotifications() {
    const mlist = document.getElementById("messages-list");
    if (!mlist) return;
    mlist.innerHTML = "";
    
    const navBadge = document.getElementById("tab-friends-badge");
    const notiBadge = document.getElementById("noti-badge");

    if (!currentUser) {
        mlist.innerHTML = "<div style='color:var(--text-muted); padding:10px;'>請先登入以查看通知。</div>";
        if (navBadge) navBadge.style.display = "none";
        if (notiBadge) notiBadge.style.display = "none";
        return;
    }
    
    const unreadMsgs = userMessages.filter(m => String(m.receiver_id) === String(currentUser.id) && m.status === 'unread');
    
    if (navBadge) {
        navBadge.innerText = unreadMsgs.length;
        navBadge.style.display = unreadMsgs.length > 0 ? "inline-block" : "none";
    }
    if (notiBadge) {
        notiBadge.innerText = unreadMsgs.length;
        notiBadge.style.display = unreadMsgs.length > 0 ? "inline-block" : "none";
    }
    
    const displayMsgs = userMessages.filter(m => String(m.receiver_id) === String(currentUser.id));
    if (displayMsgs.length === 0) {
        mlist.innerHTML = "<div style='color:var(--text-muted); padding:10px;'>目前無通知。</div>";
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    displayMsgs.forEach(m => {
        const isUnread = m.status === 'unread';
        const bg = isUnread ? "var(--override-temp-def-bg)" : "var(--table-th-bg)";
        const txtColor = isUnread ? "var(--override-temp-def-text)" : "var(--text)";
        const border = isUnread ? "1px solid var(--primary)" : "1px solid var(--border)";
        
        const name = escapeHtml(m.sender?.nickname || m.sender?.email);
        const amt = m.payload?.amount || 0;
        const notes = escapeHtml(m.payload?.notes || '');
        
        const card = document.createElement('div');
        card.style.cssText = `background:${bg}; color:${txtColor}; padding:8px; border-radius:6px; margin-bottom:6px; border:${border}`;
        
        let contentHtml = "";
        
        if (m.type === 'lend_request' && isUnread) {
            contentHtml = `<strong>💸 ${name} 請求借出 $${amt}</strong><br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意</button> 
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'borrow_request' && isUnread) {
            contentHtml = `<strong>📥 ${name} 請求借入 $${amt}</strong><br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'repay_request' && isUnread) {
            contentHtml = `<strong>✅ ${name} 請求確認已還 $${amt}</strong><br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">確認收款</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'edit_request' && isUnread) {
            contentHtml = `<strong>✏️ ${name} 請求修改紀錄</strong><br>修改為：$${amt}<br>${notes}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意修改</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'delete_request' && isUnread) {
            contentHtml = `<strong>🗑️ ${name} 請求刪除主連線紀錄</strong><br>原金額：$${amt}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意刪除</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'delete_repay_request' && isUnread) {
            contentHtml = `<strong>🗑️ ${name} 請求刪除還款紀錄</strong><br>原還款金額：$${amt}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-warning" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'accept')">同意刪除</button>
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="respondRequest('${m.id}', 'reject')">拒絕</button>
                           </div>`;
        } else if (m.type === 'notice' && isUnread) {
            contentHtml = `<strong>⚠️ 系統通知</strong><br>${m.payload?.msg || '對方已拒絕您的請求'}
                           <div style="margin-top:6px; display:flex; gap:6px; justify-content:flex-end;">
                             <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="markNoteRead('${m.id}')">了解</button>
                           </div>`;
        } else if (m.type === 'note') {
            const ctxStr = getNoteContextStr(m.payload.day, m.payload.timeKey);
            contentHtml = `<strong>💬 留言：</strong>來自 ${name}<br>
                           <span style="font-size:0.75rem; font-weight:bold; color:var(--primary);">📍 位於：${escapeHtml(ctxStr)}</span>
                           <div style="margin-top:6px; text-align:right;">
                             <button class="btn btn-danger" style="padding:2px 6px; font-size:0.7rem; margin-right:6px;" onclick="deleteMessage('${m.id}')">刪除</button>
                             <button class="btn btn-secondary" style="padding:4px 12px; font-size:0.75rem; border-radius:12px; margin-right:6px;" onclick="switchView('schedule'); readStickyNote('${m.id}')">前往查看</button>
                             ${isUnread ? `<button class="btn btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="markNoteRead('${m.id}')">標示為已讀</button>` : ''}
                           </div>`;
        }
        
        if (contentHtml) {
            card.innerHTML = contentHtml;
            fragment.appendChild(card);
        }
    });
    
    mlist.appendChild(fragment);
}

// 取得留言情境字串轉換
function getNoteContextStr(day, timeKey) {
    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
    const sch = getActiveSchedule(); 
    let dName = dayNames[day] || ""; 
    let tName = timeKey;
    
    if (!isNaN(timeKey)) {
        const p = (sch.periods || initialDefaultPeriods).find(x => String(x.id) === String(timeKey));
        const c = sch.courses[`${day}_${timeKey}`];
        tName = (p ? p.name : "") + (c && c.name ? ` - ${c.name}` : "");
    } else if (String(timeKey).startsWith('tut_')) {
        const t = (sch.tutorings || []).find(x => x.id === timeKey);
        tName = t ? `家教: ${t.student}` : "家教";
    } else if (String(timeKey).startsWith('work_')) {
        const w = (sch.works || []).find(x => x.id === timeKey);
        tName = w ? `工作: ${w.name}` : "工作";
    } else if (String(timeKey).startsWith('tmp_')) {
        const tmp = (sch.temporaryEvents || []).find(x => x.id === timeKey);
        tName = tmp ? `事件: ${tmp.title}` : "事件";
    } else if (String(timeKey).startsWith('custom_')) {
        const c = (sch.customCourses || []).find(x => x.id === timeKey);
        tName = c ? `課程: ${c.name}` : "自訂課程";
    }
    return `${dName} ${tName}`;
}

// 標示通知為已讀
async function markNoteRead(msgId) {
    const msg = userMessages.find(m => m.id === msgId); 
    if (msg) msg.status = 'read'; 
    
    renderNotifications(); 
    if (typeof renderSchedule === 'function') renderSchedule();
    
    try { 
        await supabaseClient.from('user_messages').update({status:'read'}).eq('id', msgId); 
        fetchMessages(); 
    } catch (e) { 
        console.error(e); 
    }
}

// [修復] 回傳 boolean 狀態以利判斷是否成功刪除，永久刪除通知
window.deleteMessage = function(msgId) { 
    showConfirm("確定永久刪除此通知與相關留言？", async () => {
        userMessages = userMessages.filter(m => m.id !== msgId); 
        renderNotifications(); 
        
        if (typeof renderSchedule === 'function') {
            renderSchedule();
        }
        
        try { 
            await supabaseClient.from('user_messages').delete().eq('id', msgId); 
            fetchMessages(); 
        } catch (e) { 
            console.error(e); 
        }
        
        // 若在閱讀視窗內刪除，連同視窗一起關閉
        if (currentReadingNoteId === msgId) {
            closeModal('read-note-modal');
            currentReadingNoteId = null;
        }
    });
};

// ========================================================
// 認證流程：登入、註冊、登出
// ========================================================

// 打開登入/註冊視窗
function openAuthModal() { 
    document.getElementById("auth-msg").innerText = ""; 
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
    document.getElementById("auth-modal").classList.add("active"); 
}

// 處理登入
async function handleAuthLogin() {
    const e = document.getElementById("auth-email").value.trim();
    const p = document.getElementById("auth-password").value;
    const msgEl = document.getElementById("auth-msg");
    
    if (!e || !p) { 
        msgEl.innerText = "請輸入電子郵件與密碼！"; 
        return; 
    }
    
    if (!supabaseClient) { 
        msgEl.innerText = "系統錯誤：無法連接至雲端伺服器"; 
        return; 
    }
    
    msgEl.innerText = "登入中...";
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email: e, password: p });
        
        if (error) { 
            msgEl.innerText = "登入失敗：" + error.message; 
        } else {
            currentUser = data.user;
            updateUserUI(true, e);
            closeModal("auth-modal");
            showToast("登入成功！");
            
            await fetchMyProfile();
            await fetchConnections();
            await pullCloudData();
            await fetchMessages();
        }
    } catch (err) { 
        msgEl.innerText = "發生預期外錯誤：" + err.message; 
    }
}

// 處理註冊
async function handleAuthRegister() {
    const e = document.getElementById("auth-email").value.trim();
    const p = document.getElementById("auth-password").value;
    const msgEl = document.getElementById("auth-msg");
    
    if (!e || !p) { 
        msgEl.innerText = "請輸入電子郵件與密碼！"; 
        return; 
    }
    
    if (!supabaseClient) { 
        msgEl.innerText = "系統錯誤：無法連接至雲端伺服器"; 
        return; 
    }
    
    msgEl.innerText = "註冊中...";
    try {
        const { error } = await supabaseClient.auth.signUp({ email: e, password: p });
        
        if (error) {
            msgEl.innerText = "註冊失敗：" + error.message;
        } else { 
            closeModal("auth-modal"); 
            showToast("註冊成功！請直接登入", "success"); 
        }
    } catch (err) { 
        msgEl.innerText = "發生預期外錯誤：" + err.message; 
    }
}

// 處理登出
async function handleAuthLogout() {
    showConfirm("確定登出？", async () => {
        // 重置狀態
        currentUser = null; 
        myProfile = null; 
        connectionsList = []; 
        userMessages = [];
        
        isViewingFriend = false; 
        friendState = null; 
        viewingFriendId = null;
        
        state = createDefaultState();
        localStorage.removeItem("local_schedule_v2_data");
        
        updateUserUI(false);
        updateSettingsUI();
        
        if (typeof renderSchedule === 'function') renderSchedule(); 
        if (typeof renderBillings === 'function') renderBillings(); 
        if (typeof renderFinances === 'function') renderFinances(); 
        
        renderFriendsView(); 
        renderNotifications();
        switchView('schedule');
        showToast("已成功登出");
        
        try { 
            await supabaseClient.auth.signOut(); 
        } catch (err) { 
            console.error("Supabase signOut failed:", err); 
        }
    });
}

// ========================================================
// 本地儲存與雲端同步系統
// ========================================================

// 儲存至 LocalStorage 並推播至雲端
async function saveToStorage() {
    if (isSaving) {
        pendingSave = true; // 有新的儲存需求，標記起來
        return;
    }
    
    isSaving = true;
    const text = document.getElementById("sync-user-text");
    
    if (text && text.innerText !== "儲存中...") {
        text.dataset.orig = text.innerText;
        text.innerText = "儲存中...";
    }
    
    try {
        localStorage.setItem("local_schedule_v2_data", JSON.stringify(state));
        
        if (typeof updatePresetDropdowns === 'function') {
            updatePresetDropdowns();
        }
        
        if (currentUser) {
            const success = await pushCloudData();
            if (!success) {
                throw new Error("Cloud push failed"); // 捕捉靜默失敗
            }
        }
    } catch (e) {
        console.error("儲存失敗:", e);
        showToast("本機儲存或同步失敗", "error");
    } finally {
        isSaving = false;
        
        if (text) {
            text.innerText = currentUser ? `已同步` : "未登入";
        }
        
        // 如果儲存期間有新的變更，執行補救儲存
        if (pendingSave) {
            pendingSave = false;
            setTimeout(() => saveToStorage(), 50);
        }
    }
}

// 將資料推送至 Supabase
async function pushCloudData() {
    if (!supabaseClient || !currentUser) return false;
    try {
        const { error } = await supabaseClient
            .from("user_schedules")
            .upsert({ user_id: currentUser.id, data: state, updated_at: new Date() });
            
        return !error;
    } catch (e) { 
        return false; 
    }
}

// 自雲端拉取資料，並與本地資料整合
async function pullCloudData() {
    if (!supabaseClient || !currentUser) return;
    try {
        const { data } = await supabaseClient
            .from("user_schedules")
            .select("data")
            .eq("user_id", currentUser.id)
            .single();
            
        if (data && data.data) {
            // 【重要修復】保護本地學分資料，避免被舊的雲端資料覆蓋
            const localCredits = state.credits; 
            const cloudCredits = data.data.credits;

            state = { ...createDefaultState(), ...data.data };
            state.recurringFinances = state.recurringFinances || [];
            
            // 深度防護：精準判斷雙方是否有「實質的學分課程資料」
            const hasCloudCourses = cloudCredits && cloudCredits.semesters && Object.values(cloudCredits.semesters).some(sem => sem && sem.length > 0);
            const hasLocalCourses = localCredits && localCredits.semesters && Object.values(localCredits.semesters).some(sem => sem && sem.length > 0);

            // 如果雲端完全沒課程資料，但本機有，則強制保留本機的學分進度
            if (!hasCloudCourses && hasLocalCourses) {
                state.credits = localCredits; 
            } else if (!cloudCredits && localCredits) {
                // 退回底線防護：如果雲端連 credits 物件都沒有，也保留本機
                state.credits = localCredits;
            }
            
            // 確保資料結構升級，補齊缺少的預設值
            if (typeof window.ensureCreditState === 'function') {
                window.ensureCreditState();
            }
            
            // 🔑 關鍵修復：原本只有 localStorage.setItem，現在改呼叫 saveToStorage()
            // 這樣一旦確保了狀態結構或合併了本機學分，就會立刻同步回雲端，保持兩邊一致不遺失。
            saveToStorage();
            
            applyTheme();
            applyFont();
            
            if (typeof updatePresetDropdowns === 'function') updatePresetDropdowns();
            if (typeof checkRecurringFinances === 'function') checkRecurringFinances();
            
            updateSettingsUI();
            
            if (typeof renderSchedule === 'function') renderSchedule();
            if (typeof renderBillings === 'function') renderBillings();
            if (typeof renderFinances === 'function') renderFinances();
        } else {
            await pushCloudData();
        }
    } catch (e) { 
        console.error("Pull data failed:", e); 
    }
}
// ========================================================
// 設定與介面切換系統
// ========================================================

// ================== 全新 FAB 控制邏輯 ==================
window.toggleFabMenu = function(type) {
    triggerHaptic(15);
    const menu = document.getElementById(`${type}-fab-menu`);
    const btn = document.getElementById(`${type}-fab-button`);
    if (!menu || !btn) return;
    
    // 如果是展開狀態，就關閉
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        btn.classList.remove('active');
    } else {
        // 先把其他頁面的選單關閉
        closeAllFabs();
        menu.classList.add('active');
        btn.classList.add('active');
    }
};

window.closeAllFabs = function() {
    ['schedule', 'billing', 'finance'].forEach(type => {
        const menu = document.getElementById(`${type}-fab-menu`);
        const btn = document.getElementById(`${type}-fab-button`);
        if (menu) menu.classList.remove('active');
        if (btn) btn.classList.remove('active');
    });
};

// 記帳：帶入預設類型直接開啟
window.openFinanceModalWithType = function(type) {
    openFinanceModal();
    const typeSelect = document.getElementById('fin-type');
    if (typeSelect) {
        typeSelect.value = type;
        onFinanceTypeChange(); // 觸發類別連動更新
    }
};

// ================== 介面與設定切換 ==================
function switchView(view) {
    closeAllFabs(); // 💡 切換頁面時，自動收起所有展開的 + 號選單
    triggerHaptic(20);
    
    if (view !== 'schedule' && isViewingFriend) {
        exitFriendView();
    }
    
    // 切換導覽列與面板顯示
    ["schedule", "billing", "finance", "friends", "settings"].forEach(v => {
        const btn = document.getElementById(`tab-btn-${v}`); 
        if (btn) { 
            if (view === v) btn.classList.add("active"); 
            else btn.classList.remove("active"); 
        }
        
        const panel = document.getElementById(`${v}-view`); 
        if (panel) {
            panel.style.display = view === v ? "block" : "none";
        }
    });
    
    // 重新渲染對應頁面內容
    if (view === "billing" && typeof renderBillings === 'function') renderBillings(); 
    if (view === "finance" && typeof renderFinances === 'function') renderFinances(); 
    if (view === "friends") { 
        fetchConnections(); 
        fetchMessages(); 
    }
    if (view === "settings") updateSettingsUI();
}

function updateSettingsUI() {
    const s24 = document.getElementById("toggle-24h");
    const slp = document.getElementById("toggle-late-periods");
    const sdd = document.getElementById("toggle-deadlines");
    const stu = document.getElementById("toggle-tutor");
    const sSync = document.getElementById("toggle-sync-course");
    const sHidden = document.getElementById("toggle-hidden-items"); // 新增開關
    
    if (s24) s24.className = `toggle-switch ${state.is24HourMode ? "active" : ""}`;
    if (slp) slp.className = `toggle-switch ${state.showLatePeriods ? "active" : ""}`;
    if (sdd) sdd.className = `toggle-switch ${state.showDeadlines !== false ? "active" : ""}`;
    if (stu) stu.className = `toggle-switch ${state.showTutoring ? "active" : ""}`;
    if (sSync) sSync.className = `toggle-switch ${state.syncCourseName !== false ? "active" : ""}`;
    if (sHidden) sHidden.className = `toggle-switch ${state.showHiddenItems ? "active" : ""}`;
    
    const ta = document.getElementById("settings-text-align");
    if (ta) ta.value = state.textAlign || "center";
    
    // 🌟 同步字型選單
    const fontSel = document.getElementById("settings-font-select");
    if (fontSel) fontSel.value = state.fontFamily || "default";
}

function toggle24HourMode() { 
    triggerHaptic(20); 
    state.is24HourMode = !state.is24HourMode; 
    updateSettingsUI();
    saveToStorage(); 
    if (typeof renderSchedule === 'function') renderSchedule(); 
}

function toggleLatePeriods() { 
    triggerHaptic(20);
    state.showLatePeriods = !state.showLatePeriods; 
    updateSettingsUI();
    saveToStorage(); 
    if (typeof renderSchedule === 'function') renderSchedule(); 
}

function toggleDeadlineBanner() { 
    triggerHaptic(20);
    state.showDeadlines = !state.showDeadlines; 
    updateSettingsUI();
    saveToStorage(); 
    if (typeof renderSchedule === 'function') renderSchedule(); 
}

function toggleTutorView() { 
    triggerHaptic(20);
    state.showTutoring = !state.showTutoring; 
    updateSettingsUI();
    saveToStorage(); 
    if (typeof renderSchedule === 'function') renderSchedule(); 
}

function onTextAlignChange(val) { 
    triggerHaptic(15); 
    state.textAlign = val; 
    updateSettingsUI();
    saveToStorage(); 
    if (typeof renderSchedule === 'function') renderSchedule(); 
}

window.toggleSyncCourseName = function() {
    triggerHaptic(20);
    state.syncCourseName = state.syncCourseName === false ? true : false;
    updateSettingsUI();
    saveToStorage();
};

// ================== 主題與字型系統 ==================
function initThemeDropdown() { 
    const select = document.getElementById("theme-style-select"); 
    if (!select) return; 
    
    const fragment = document.createDocumentFragment();
    THEME_OPTIONS[state.themeMode || "light"].forEach((opt) => { 
        const optionEl = document.createElement("option"); 
        optionEl.value = opt.id; 
        optionEl.innerText = opt.name; 
        if (opt.id === state.themeStyle) optionEl.selected = true; 
        fragment.appendChild(optionEl); 
    });
    
    select.innerHTML = "";
    select.appendChild(fragment);
}

window.applyFont = function() {
    const root = document.documentElement;
    if (!state.fontFamily || state.fontFamily === "default") {
        // 清除變數，恢復預設
        root.style.removeProperty("--current-font");
    } else if (state.fontFamily === "KaiTi") {
        // 楷體需要同時宣告擴展字面作為備用
        root.style.setProperty("--current-font", `'KaiTi', 'KaiTi-Ext', sans-serif`);
    } else {
        root.style.setProperty("--current-font", `'${state.fontFamily}', sans-serif`);
    }
};

// 處理選單切換事件
window.onFontChange = function(fontVal) {
    triggerHaptic(15);
    state.fontFamily = fontVal;
    
    if (fontVal === "KaiTi") {
        // 第 7 個參數傳入 "btn btn-secondary"，讓按鈕變為透明底色普通樣式
        showConfirm(
            "數位發展部，CNS11643 中文標準交換碼全字庫網站，https://www.cns11643.gov.tw", 
            null, "確認", false, true, true, "btn btn-secondary"
        );
    }
    
    applyFont();
    saveToStorage();
};

function toggleThemeMode() { 
    triggerHaptic(20); 
    if (state.themeMode === "light") { 
        state.lastLightStyle = state.themeStyle; 
        state.themeMode = "dark"; 
        state.themeStyle = state.lastDarkStyle || "dark-tokyo-night"; 
    } else { 
        state.lastDarkStyle = state.themeStyle; 
        state.themeMode = "light"; 
        state.themeStyle = state.lastLightStyle || "light-swiss-blue"; 
    } 
    applyTheme(); 
}

function onThemeStyleSelect(styleId) { 
    triggerHaptic(20); 
    state.themeStyle = styleId; 
    state.themeMode = styleId.startsWith("dark") ? "dark" : "light"; 
    
    if (state.themeMode === "dark") {
        state.lastDarkStyle = styleId;
    } else {
        state.lastLightStyle = styleId;
    } 
    applyTheme(); 
}

function applyTheme() { 
    document.documentElement.setAttribute("data-theme-style", state.themeStyle); 
    const btn = document.getElementById("theme-toggle-btn"); 
    if (btn) btn.innerText = state.themeMode === "dark" ? "淺色" : "深色"; 
    initThemeDropdown(); 

    // 👇 動態抓取當前主題的背景色變數（--bg），並即時套用到狀態欄 👇
    setTimeout(() => {
        const currentBgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor && currentBgColor) {
            metaThemeColor.setAttribute("content", currentBgColor);
        }
    }, 50);

    if (typeof renderSchedule === 'function') renderSchedule(); 
    saveToStorage(); 
}

// ========================================================
// 課程細節與筆記/出缺席管理
// ========================================================

window.getCourseDates = function(sch, courseDay, includeNext = false) {
    const start = parseLocalDate(sch.startDate || "2026-09-07");
    const end = parseLocalDate(sch.endDate || "2027-01-10");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let current = new Date(start);
    let targetDay = Number(courseDay) % 7; 
    
    if (isNaN(targetDay)) return [];
    
    while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
    }
    
    const dates = [];
    let foundNext = false;
    
    while (current <= end) {
        if (current <= today) {
            dates.push(formatDate(current));
        } else if (includeNext && !foundNext) {
            dates.push(formatDate(current));
            foundNext = true;
            break;
        } else {
            break;
        }
        current.setDate(current.getDate() + 7);
    }
    return dates;
};

window.getCourseObjForEdit = function(day, periodId) {
    const sch = getActiveSchedule();
    if (String(periodId).startsWith("custom_")) {
        return (sch.customCourses || []).find(c => c.id === periodId);
    }
    return sch.courses[`${day}_${periodId}`];
};

window.switchDetailTab = function(tabId) {
    ['info', 'notes', 'attendance'].forEach(id => {
        const btn = document.getElementById(`tab-btn-${id}`);
        const content = document.getElementById(`tab-content-${id}`);
        if (btn && content) {
            if (id === tabId) {
                btn.style.borderBottom = "2px solid var(--primary)";
                btn.style.color = "var(--primary)";
                content.style.display = "block";
            } else {
                btn.style.borderBottom = "2px solid transparent";
                btn.style.color = "var(--text-muted)";
                content.style.display = "none";
            }
        }
    });
    if (tabId === 'notes') autoExpandTextareasInModal();
};

// 標記出缺席
window.markAttendance = function(courseKey, date, status) {
    triggerHaptic(15);
    const sch = getActiveSchedule();
    const firstUnderscore = courseKey.indexOf("_");
    const day = courseKey.substring(0, firstUnderscore);
    const periodId = courseKey.substring(firstUnderscore + 1);
    
    let courseObj = getCourseObjForEdit(day, periodId);
    if (!courseObj) return;
    
    if (!courseObj.attendance) courseObj.attendance = {};
    if (courseObj.attendance[date] === status) {
        delete courseObj.attendance[date]; 
    } else {
        courseObj.attendance[date] = status;
    }
    
    // 如果開啟同步，將出缺席狀態同步給所有同名課程
    if (state.syncCourseName !== false && courseObj.name) {
        Object.keys(sch.courses || {}).forEach(k => {
            if (sch.courses[k].name === courseObj.name) {
                sch.courses[k].attendance = structuredClone(courseObj.attendance);
            }
        });
        (sch.customCourses || []).forEach(c => {
            if (c.name === courseObj.name) {
                c.attendance = structuredClone(courseObj.attendance);
            }
        });
    }
    
    saveToStorage();
    
    // 保持目前的畫面位置重新渲染
    const scrollPos = document.querySelector('#view-detail-modal .modal-content').scrollTop;
    if (currentViewingOverrideId) {
        const ovr = (sch.overrides || []).find(o => o.id === currentViewingOverrideId);
        openViewDetailModal("override", { ovr }, 'attendance');
    } else {
        openViewDetailModal("school", { day, periodId, course: courseObj }, 'attendance');
    }
    document.querySelector('#view-detail-modal .modal-content').scrollTop = scrollPos;
};

// 儲存單日課程筆記
window.saveCourseNote = function(courseKey) {
    triggerHaptic(15);
    const date = document.getElementById('course-note-date').value;
    const content = document.getElementById('course-note-input').value.trim();
    if (!content) { 
        showToast('請輸入筆記內容', 'error'); 
        return; 
    }
    
    const sch = getActiveSchedule();
    const firstUnderscore = courseKey.indexOf("_");
    const day = courseKey.substring(0, firstUnderscore);
    const periodId = courseKey.substring(firstUnderscore + 1);
    let courseObj = getCourseObjForEdit(day, periodId);
    if (!courseObj) return;
    
    if (!courseObj.notes) courseObj.notes = [];
    courseObj.notes.push({ id: 'note_' + Date.now(), date, content });
    
    // 如果開啟同步，將筆記同步給所有同名課程
    if (state.syncCourseName !== false && courseObj.name) {
        Object.keys(sch.courses || {}).forEach(k => {
            if (sch.courses[k].name === courseObj.name) {
                sch.courses[k].notes = structuredClone(courseObj.notes);
            }
        });
        (sch.customCourses || []).forEach(c => {
            if (c.name === courseObj.name) {
                c.notes = structuredClone(courseObj.notes);
            }
        });
    }
    
    saveToStorage();
    
    const scrollPos = document.querySelector('#view-detail-modal .modal-content').scrollTop;
    if (currentViewingOverrideId) {
        const ovr = (sch.overrides || []).find(o => o.id === currentViewingOverrideId);
        openViewDetailModal("override", { ovr }, 'notes');
    } else {
        openViewDetailModal("school", { day, periodId, course: courseObj }, 'notes');
    }
    document.querySelector('#view-detail-modal .modal-content').scrollTop = scrollPos;
};

// 刪除單日課程筆記
window.deleteCourseNote = function(courseKey, noteId) {
    showConfirm("確定刪除此筆記？", () => {
        triggerHaptic(15);
        const sch = getActiveSchedule();
        const firstUnderscore = courseKey.indexOf("_");
        const day = courseKey.substring(0, firstUnderscore);
        const periodId = courseKey.substring(firstUnderscore + 1);
        let courseObj = getCourseObjForEdit(day, periodId);
        if (!courseObj) return;
        
        courseObj.notes = courseObj.notes.filter(n => n.id !== noteId);
        
        if (state.syncCourseName !== false && courseObj.name) {
            Object.keys(sch.courses || {}).forEach(k => {
                if (sch.courses[k].name === courseObj.name) {
                    sch.courses[k].notes = structuredClone(courseObj.notes);
                }
            });
            (sch.customCourses || []).forEach(c => {
                if (c.name === courseObj.name) {
                    c.notes = structuredClone(courseObj.notes);
                }
            });
        }
        
        saveToStorage();
        
        const scrollPos = document.querySelector('#view-detail-modal .modal-content').scrollTop;
        if (currentViewingOverrideId) {
            const ovr = (sch.overrides || []).find(o => o.id === currentViewingOverrideId);
            openViewDetailModal("override", { ovr }, 'notes');
        } else {
            openViewDetailModal("school", { day, periodId, course: courseObj }, 'notes');
        }
        document.querySelector('#view-detail-modal .modal-content').scrollTop = scrollPos;
    });
};

// 編輯單日課程筆記 (帶入資料)
window.editCourseNote = function(courseKey, noteId) {
    const sch = getActiveSchedule();
    const firstUnderscore = courseKey.indexOf("_");
    const day = courseKey.substring(0, firstUnderscore);
    const periodId = courseKey.substring(firstUnderscore + 1);
    let courseObj = getCourseObjForEdit(day, periodId);
    if (!courseObj || !courseObj.notes) return;

    const note = courseObj.notes.find(n => n.id === noteId);
    if (!note) return;

    // 將資料帶回輸入框
    document.getElementById('course-note-date').value = note.date;
    document.getElementById('course-note-input').value = note.content;

    // 變更按鈕樣式與事件
    const btn = document.getElementById('btn-save-note');
    if (btn) {
        btn.innerText = "儲存修改";
        btn.style.background = "#f59e0b"; // 變成橘色提示正在編輯
        btn.onclick = function() { 
            updateCourseNote(courseKey, noteId); 
        };
    }
};

// 儲存修改後的筆記
window.updateCourseNote = function(courseKey, noteId) {
    triggerHaptic(15);
    const date = document.getElementById('course-note-date').value;
    const content = document.getElementById('course-note-input').value.trim();
    if (!content) { 
        showToast('請輸入筆記內容', 'error'); 
        return; 
    }

    const sch = getActiveSchedule();
    const firstUnderscore = courseKey.indexOf("_");
    const day = courseKey.substring(0, firstUnderscore);
    const periodId = courseKey.substring(firstUnderscore + 1);
    let courseObj = getCourseObjForEdit(day, periodId);
    if (!courseObj || !courseObj.notes) return;

    // 找出該筆記並更新
    const note = courseObj.notes.find(n => n.id === noteId);
    if (note) {
        note.date = date;
        note.content = content;
    }

    // 若有開啟同步，同步更新給同名課程
    if (state.syncCourseName !== false && courseObj.name) {
        Object.keys(sch.courses || {}).forEach(k => {
            if (sch.courses[k].name === courseObj.name) {
                sch.courses[k].notes = structuredClone(courseObj.notes);
            }
        });
        (sch.customCourses || []).forEach(c => {
            if (c.name === courseObj.name) {
                c.notes = structuredClone(courseObj.notes);
            }
        });
    }

    saveToStorage();

    // 留在當前畫面並保持滾動位置
    const scrollPos = document.querySelector('#view-detail-modal .modal-content').scrollTop;
    if (currentViewingOverrideId) {
        const ovr = (sch.overrides || []).find(o => o.id === currentViewingOverrideId);
        openViewDetailModal("override", { ovr }, 'notes');
    } else {
        openViewDetailModal("school", { day, periodId, course: courseObj }, 'notes');
    }
    document.querySelector('#view-detail-modal .modal-content').scrollTop = scrollPos;
    showToast("筆記已成功更新");
};

// 儲存總備忘錄與本週備忘錄
window.saveCourseMemos = function(courseKey) {
    triggerHaptic(15);
    const sch = getActiveSchedule();
    const firstUnderscore = courseKey.indexOf("_");
    const day = courseKey.substring(0, firstUnderscore);
    const periodId = courseKey.substring(firstUnderscore + 1);
    let courseObj = getCourseObjForEdit(day, periodId);
    if (!courseObj) return;

    const newMemo = document.getElementById('detail-memo-input').value.trim();
    const newWeeklyMemo = document.getElementById('detail-weekly-memo-input').value.trim();
    const weekKey = getWeekKey(new Date());

    courseObj.memo = newMemo;

    // 若有開啟連動，同步給所有同名課程
    if (state.syncCourseName !== false && courseObj.name) {
        Object.keys(sch.courses || {}).forEach(k => {
            if (sch.courses[k].name === courseObj.name) {
                sch.courses[k].memo = newMemo;
            }
        });
        (sch.customCourses || []).forEach(c => {
            if (c.name === courseObj.name) {
                c.memo = newMemo;
            }
        });
    }

    // 每週備忘錄獨立處理
    if (!sch.weeklyMemos) sch.weeklyMemos = {};
    if (!sch.weeklyMemos[weekKey]) sch.weeklyMemos[weekKey] = {};
    
    if (newWeeklyMemo) {
        sch.weeklyMemos[weekKey][`school_${courseKey}`] = newWeeklyMemo;
    } else {
        delete sch.weeklyMemos[weekKey][`school_${courseKey}`];
    }

    saveToStorage();
    renderSchedule();
    showToast("備忘錄已儲存更新");
};

// 新增課程重要日程 (Deadlines)
window.addCourseDeadline = function(courseKey) {
    triggerHaptic(15);
    const title = document.getElementById('detail-new-dl-title').value.trim();
    const date = document.getElementById('detail-new-dl-date').value;
    
    if (!title || !date) { 
        showToast("請填寫日程名稱與日期！", "error"); 
        return; 
    }

    const sch = getActiveSchedule();
    const firstUnderscore = courseKey.indexOf("_");
    const day = courseKey.substring(0, firstUnderscore);
    const periodId = courseKey.substring(firstUnderscore + 1);
    let courseObj = getCourseObjForEdit(day, periodId);
    if (!courseObj) return;

    if (!courseObj.deadlines) courseObj.deadlines = [];
    courseObj.deadlines.push({ id: "dl_" + Date.now(), title, date });

    if (state.syncCourseName !== false && courseObj.name) {
        Object.keys(sch.courses || {}).forEach(k => {
            if (sch.courses[k].name === courseObj.name) {
                sch.courses[k].deadlines = structuredClone(courseObj.deadlines);
            }
        });
        (sch.customCourses || []).forEach(c => {
            if (c.name === courseObj.name) {
                c.deadlines = structuredClone(courseObj.deadlines);
            }
        });
    }

    saveToStorage();
    
    // 留在該分頁並重新渲染
    const scrollPos = document.querySelector('#view-detail-modal .modal-content').scrollTop;
    if (currentViewingOverrideId) {
        const ovr = (sch.overrides || []).find(o => o.id === currentViewingOverrideId);
        openViewDetailModal("override", { ovr }, 'notes');
    } else {
        openViewDetailModal("school", { day, periodId, course: courseObj }, 'notes');
    }
    document.querySelector('#view-detail-modal .modal-content').scrollTop = scrollPos;
    showToast("重要日程已新增");
};

// 刪除課程重要日程
window.deleteCourseDeadline = function(courseKey, dlId) {
    showConfirm("確定刪除此日程？", () => {
        triggerHaptic(15);
        const sch = getActiveSchedule();
        const firstUnderscore = courseKey.indexOf("_");
        const day = courseKey.substring(0, firstUnderscore);
        const periodId = courseKey.substring(firstUnderscore + 1);
        let courseObj = getCourseObjForEdit(day, periodId);
        if (!courseObj) return;

        courseObj.deadlines = (courseObj.deadlines || []).filter(d => d.id !== dlId);

        if (state.syncCourseName !== false && courseObj.name) {
            Object.keys(sch.courses || {}).forEach(k => {
                if (sch.courses[k].name === courseObj.name) {
                    sch.courses[k].deadlines = structuredClone(courseObj.deadlines);
                }
            });
            (sch.customCourses || []).forEach(c => {
                if (c.name === courseObj.name) {
                    c.deadlines = structuredClone(courseObj.deadlines);
                }
            });
        }
        
        saveToStorage();
        
        const scrollPos = document.querySelector('#view-detail-modal .modal-content').scrollTop;
        if (currentViewingOverrideId) {
            const ovr = (sch.overrides || []).find(o => o.id === currentViewingOverrideId);
            openViewDetailModal("override", { ovr }, 'notes');
        } else {
            openViewDetailModal("school", { day, periodId, course: courseObj }, 'notes');
        }
        document.querySelector('#view-detail-modal .modal-content').scrollTop = scrollPos;
    });
};

// ========================================================
// 課表建立、管理與拖曳排序系統
// ========================================================

function openScheduleSelectModal() { 
    const listEl = document.getElementById("schedule-select-list"); 
    if (!listEl) return;
    listEl.innerHTML = ""; 
    
    const targetState = isViewingFriend ? friendState : state;
    
    (targetState.schedules || []).forEach((sch) => { 
        const isActive = sch.id === targetState.activeScheduleId; 
        const item = document.createElement("div"); 
        
        item.className = "draggable-schedule-item";
        item.dataset.id = sch.id;
        item.draggable = !isViewingFriend;
        item.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid var(--border); background:${isActive ? "var(--today-header-bg)" : "var(--card-bg)"}; border-radius:6px; margin-bottom:4px; transition: transform 0.2s;`; 
        
        let html = `
            <div style="display:flex; align-items:center; gap:8px;">
                ${!isViewingFriend ? `<div class="drag-handle" style="color:var(--text-muted); cursor:grab; padding: 4px; font-size:1.1rem; user-select:none;">☰</div>` : ''}
                <div>
                    <div style="font-weight:700; font-size:0.85rem; color:${isActive ? "var(--today-header-text)" : "var(--text)"};">${escapeHtml(sch.title)}</div>
                    <div style="font-size:0.68rem; color:var(--text-muted);">${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}</div>
                </div>
            </div>
            <div style="display:flex; gap:4px; align-items:center;">
                ${!isActive 
                    ? `<button class="btn" style="padding:2px 6px; font-size:0.68rem;" onclick="switchActiveSchedule('${sch.id}')">切換</button>` 
                    : `<span class="tag-paid" style="font-size:0.68rem;">顯示中</span>`}
                ${(!isViewingFriend && targetState.schedules.length > 1) 
                    ? `<button class="btn btn-danger" style="padding:2px 6px; font-size:0.68rem;" onclick="deleteSchedule('${sch.id}')">刪除</button>` 
                    : ""}
            </div>
        `; 
        item.innerHTML = html;
        listEl.appendChild(item); 
    }); 
    
    // 加入拖曳排序監聽事件
    if (!isViewingFriend) {
        initScheduleDragAndDrop(listEl);
    }
    
    document.getElementById("schedule-select-modal").classList.add("active"); 
}

// 初始化課表拖曳管理
window.initScheduleDragAndDrop = function(listEl) {
    let draggedItem = null;
    let ghostItem = null;
    let placeholder = null;
    let startX = 0, startY = 0;
    
    let currentDragY = 0;
    let autoScrollInterval = null;

    // 邊緣自動滾動邏輯
    const handleAutoScroll = () => {
        if (autoScrollInterval) return;
        autoScrollInterval = setInterval(() => {
            const rect = listEl.getBoundingClientRect();
            const threshold = 40; // 距離邊緣多少開始滾動
            let step = 0;
            
            if (currentDragY - rect.top < threshold && currentDragY > rect.top - 20) {
                step = -8;
            } else if (rect.bottom - currentDragY < threshold && currentDragY < rect.bottom + 20) {
                step = 8;
            }

            if (step !== 0) {
                listEl.scrollTop += step;
            } else {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        }, 16);
    };

    const stopAutoScroll = () => {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    };

    Array.from(listEl.children).forEach((item) => {
        const handle = item.querySelector('.drag-handle');
        if (!handle) return;
        
        const startDrag = (clientX, clientY) => {
            draggedItem = item;
            
            placeholder = document.createElement('div');
            placeholder.style.height = `${item.offsetHeight}px`;
            placeholder.style.background = 'var(--slot-hover)';
            placeholder.style.borderRadius = '6px';
            placeholder.style.marginBottom = window.getComputedStyle(item).marginBottom;
            item.parentNode.insertBefore(placeholder, item);

            ghostItem = item.cloneNode(true);
            ghostItem.style.position = 'fixed';
            ghostItem.style.zIndex = '99999';
            ghostItem.style.width = `${item.offsetWidth}px`;
            ghostItem.style.boxShadow = '0 10px 25px rgba(0,0,0,0.25)';
            ghostItem.style.opacity = '0.9';
            ghostItem.style.pointerEvents = 'none';
            ghostItem.style.transition = 'none';
            
            const rect = item.getBoundingClientRect();
            startX = clientX - rect.left;
            startY = clientY - rect.top;
            ghostItem.style.left = `${rect.left}px`;
            ghostItem.style.top = `${rect.top}px`;
            
            document.body.appendChild(ghostItem);
            item.style.display = 'none';
        };

        const moveDrag = (clientX, clientY) => {
            if (!draggedItem || !ghostItem) return;
            
            currentDragY = clientY;
            handleAutoScroll();

            ghostItem.style.left = `${clientX - startX}px`;
            ghostItem.style.top = `${clientY - startY}px`;

            const target = document.elementFromPoint(clientX, clientY);
            if (!target) return;
            const targetItem = target.closest('.draggable-schedule-item');
            
            if (targetItem && targetItem !== draggedItem && targetItem !== placeholder) {
                const rect = targetItem.getBoundingClientRect();
                const isAfter = (clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                listEl.insertBefore(placeholder, isAfter ? targetItem.nextSibling : targetItem);
            }
        };

        const endDrag = () => {
            if (!draggedItem) return;
            stopAutoScroll();
            
            placeholder.parentNode.insertBefore(draggedItem, placeholder);
            draggedItem.style.display = 'flex'; 
            
            if (ghostItem) ghostItem.remove();
            if (placeholder) placeholder.remove();
            
            draggedItem = null;
            ghostItem = null;
            placeholder = null;
            document.body.style.overflow = '';
            
            // 更新狀態並儲存
            const newOrderIds = Array.from(listEl.children).map(child => child.dataset.id);
            state.schedules.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
            saveToStorage();
        };

        // 電腦版事件監聽
        item.addEventListener('dragstart', (e) => e.preventDefault());
        
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
            
            const onMouseMove = (ev) => moveDrag(ev.clientX, ev.clientY);
            const onMouseUp = () => {
                endDrag();
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
            
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // 手機版觸控事件監聽
        handle.addEventListener('touchstart', (e) => {
            triggerHaptic(15);
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
            document.body.style.overflow = 'hidden';
        }, {passive: false});

        handle.addEventListener('touchmove', (e) => {
            if (!draggedItem) return;
            e.preventDefault();
            const touch = e.touches[0];
            moveDrag(touch.clientX, touch.clientY);
        }, {passive: false});

        handle.addEventListener('touchend', endDrag);
        handle.addEventListener('touchcancel', endDrag);
    });
};

function switchActiveSchedule(schId) { 
    triggerHaptic(20); 
    
    if (isViewingFriend) { 
        friendState.activeScheduleId = schId; 
        if (typeof renderSchedule === 'function') renderSchedule(); 
    } else { 
        state.activeScheduleId = schId; 
        saveToStorage(); 
        
        if (typeof updatePresetDropdowns === 'function') updatePresetDropdowns(); 
        if (typeof renderSchedule === 'function') renderSchedule(); 
    } 
    closeModal("schedule-select-modal"); 
}

function openCreateScheduleModal() { 
    document.getElementById("new-sch-title").value = ""; 
    document.getElementById("new-sch-start").value = formatDate(new Date()); 
    document.getElementById("new-sch-end").value = "2027-01-10"; 
    
    closeModal("schedule-select-modal"); 
    document.getElementById("create-schedule-modal").classList.add("active"); 
}

function confirmCreateSchedule() { 
    const title = document.getElementById("new-sch-title").value.trim();
    const start = document.getElementById("new-sch-start").value;
    const end = document.getElementById("new-sch-end").value;
    
    if (!title || !start || !end) {
        showToast("請完整填寫！", "error"); 
        return;
    }
    
    if (new Date(start) > new Date(end)) {
        showToast("結束日期不能早於開始日期！", "error");
        return;
    }
    
    const newId = "sch_" + Date.now(); 
    state.schedules.push({ 
        id: newId, 
        title, 
        startDate: start, 
        endDate: end, 
        periods: structuredClone(initialDefaultPeriods), 
        courses: {}, 
        tutorings: [], 
        works: [], 
        overrides: [], 
        temporaryEvents: [], 
        weeklyMemos: {} 
    }); 
    
    state.activeScheduleId = newId; 
    saveToStorage(); 
    
    if (typeof updatePresetDropdowns === 'function') updatePresetDropdowns(); 
    if (typeof renderSchedule === 'function') renderSchedule(); 
    
    closeModal("create-schedule-modal"); 
    showToast(`已建立並切換至「${title}」！`); 
}

function deleteSchedule(schId) { 
    if (state.schedules.length <= 1) { 
        showToast("必須保留至少一個課表！", "error"); 
        return; 
    }
    
    showConfirm("確定刪除此課表？", () => { 
        state.schedules = state.schedules.filter((s) => s.id !== schId); 
        
        if (state.activeScheduleId === schId) {
            state.activeScheduleId = state.schedules[0].id; 
        }
        
        saveToStorage(); 
        
        if (typeof updatePresetDropdowns === 'function') updatePresetDropdowns(); 
        if (typeof renderSchedule === 'function') renderSchedule(); 
        
        openScheduleSelectModal(); 
    }); 
}

function openScheduleConfigModal() { 
    const sch = getActiveSchedule(); 
    document.getElementById("sch-conf-title").value = sch.title || "學期課表"; 
    document.getElementById("sch-conf-start").value = sch.startDate || "2026-09-07"; 
    document.getElementById("sch-conf-end").value = sch.endDate || "2027-01-10"; 
    document.getElementById("schedule-config-modal").classList.add("active"); 
}

function saveScheduleConfig() { 
    const title = document.getElementById("sch-conf-title").value.trim() || "學期課表";
    const start = document.getElementById("sch-conf-start").value;
    const end = document.getElementById("sch-conf-end").value;
    
    if (!start || !end) { 
        showToast("請完整填寫日期！", "error"); 
        return; 
    }
    
    const sch = getActiveSchedule(); 
    sch.title = title; 
    sch.startDate = start; 
    sch.endDate = end; 
    
    saveToStorage(); 
    
    if (typeof renderSchedule === 'function') renderSchedule(); 
    closeModal("schedule-config-modal"); 
}

function openPeriodConfigModal() { 
    const sch = getActiveSchedule(); 
    const tbody = document.getElementById("period-config-body"); 
    if (!tbody) return;
    
    tbody.innerHTML = ""; 
    
    (sch.periods || initialDefaultPeriods).forEach((p, idx) => { 
        const tr = document.createElement("tr"); 
        tr.innerHTML = `
            <td style="font-weight:700;">${p.id}</td>
            <td><input type="text" id="cfg-pname-${idx}" value="${escapeHtml(p.name)}"></td>
            <td><input type="time" id="cfg-pstart-${idx}" value="${p.start}"></td>
            <td><input type="time" id="cfg-pend-${idx}" value="${p.end}"></td>
        `; 
        tbody.appendChild(tr); 
    }); 
    
    document.getElementById("period-config-modal").classList.add("active"); 
}

function savePeriodConfig() { 
    const sch = getActiveSchedule();
    const updated = [];
    const current = sch.periods || initialDefaultPeriods; 
    
    for (let i = 0; i < current.length; i++) { 
        const name = document.getElementById(`cfg-pname-${i}`).value.trim() || `第 ${i + 1} 節`;
        const start = document.getElementById(`cfg-pstart-${i}`).value;
        const end = document.getElementById(`cfg-pend-${i}`).value;
        
        if (!start || !end) { 
            showToast(`請填寫第 ${i + 1} 節時間！`, "error"); 
            return; 
        }
        
        updated.push({ 
            id: current[i].id, 
            name, 
            start, 
            end, 
            optional: Boolean(current[i].optional) 
        }); 
    } 
    
    sch.periods = updated; 
    saveToStorage(); 
    
    if (typeof renderSchedule === 'function') renderSchedule(); 
    closeModal("period-config-modal"); 
}

function resetPeriodsToDefault() { 
    showConfirm("恢復預設節次？", () => { 
        getActiveSchedule().periods = structuredClone(initialDefaultPeriods); 
        saveToStorage(); 
        
        openPeriodConfigModal(); 
        if (typeof renderSchedule === 'function') renderSchedule(); 
    }); 
}
// ========================================================
// 初始化執行與啟動畫面
// ========================================================

function init() {
    const saved = localStorage.getItem("local_schedule_v2_data");
    
    if (saved) { 
        try { 
            const parsed = JSON.parse(saved); 
            if (parsed && typeof parsed === "object") { 
                state = { ...createDefaultState(), ...parsed }; 
                state.recurringFinances = state.recurringFinances || []; 
                
                if (state.showDeadlines === undefined) {
                    state.showDeadlines = true; 
                }
                
                if (!parsed.schedules || parsed.schedules.length === 0) { 
                    const dId = "sch_" + Date.now(); 
                    state.schedules = [{ 
                        id: dId, 
                        title: parsed.scheduleTitle || "115學年度上學期課表", 
                        startDate: parsed.scheduleStartDate || "2026-09-07", 
                        endDate: parsed.scheduleEndDate || "2027-01-10", 
                        periods: parsed.periods || structuredClone(initialDefaultPeriods), 
                        courses: parsed.courses || {}, 
                        tutorings: parsed.tutorings || [], 
                        works: parsed.works || [], 
                        overrides: parsed.overrides || [], 
                        temporaryEvents: parsed.temporaryEvents || [], 
                        weeklyMemos: parsed.weeklyMemos || {} 
                    }]; 
                    state.activeScheduleId = dId; 
                } 
            } 
        } catch (e) { 
            console.error("載入本地資料失敗:", e); 
        } 
    }

    // 確保資料結構升級 (很重要，這行解決重開遺失問題)
    if (typeof window.ensureCreditState === 'function') {
        window.ensureCreditState();
    }
    
    document.documentElement.setAttribute("data-theme-style", state.themeStyle); 
    initThemeDropdown(); 
    document.getElementById("theme-toggle-btn").innerText = state.themeMode === "dark" ? "淺色" : "深色"; 
    
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; 
    
    if (!document.getElementById("bill-month-filter").value) {
        document.getElementById("bill-month-filter").value = ym; 
    }
    if (!document.getElementById("fin-month-filter").value) {
        document.getElementById("fin-month-filter").value = ym;
    }
    
    updateSettingsUI();
    applyFont();
    
    if (typeof updatePresetDropdowns === 'function') updatePresetDropdowns(); 
    if (typeof checkRecurringFinances === 'function') checkRecurringFinances(); 
    if (typeof renderSchedule === 'function') renderSchedule(); 
    if (typeof renderBillings === 'function') renderBillings(); 
    if (typeof renderFinances === 'function') renderFinances(); 
    
    checkAuthSession();
    switchView('schedule');
    
    // 關閉啟動畫面
    const dismissSplash = () => {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
            splashScreen.classList.add('hidden');
            setTimeout(() => { 
                splashScreen.remove(); 
            }, 500);
        }
    };
    
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.addEventListener('click', dismissSplash);
        splashScreen.addEventListener('touchstart', dismissSplash);
    }
    
    setTimeout(() => { 
        dismissSplash(); 
    }, 2500);

    initCustomDatePicker();
}

// 取得該週的星期一
function getMondayOfWeek(d, offsetWeeks = 0) { 
    const date = new Date(d);
    const day = date.getDay(); 
    date.setDate(date.getDate() - day + (day === 0 ? -6 : 1) + offsetWeeks * 7); 
    date.setHours(0, 0, 0, 0); 
    return date; 
}

function getWeekKey(d) { 
    return formatDate(getMondayOfWeek(d, currentWeekOffset)); 
}

function formatDate(d) { 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; 
}

// [修復] Date 轉換解析風險
function formatSlashDate(dateStr) { 
    if (!dateStr) return "";
    const p = String(dateStr).split("-"); 
    return p.length === 3 ? `${p[0]}/${Number(p[1])}/${Number(p[2])}` : dateStr; 
}

function formatShortDate(d) { 
    return `${d.getMonth() + 1}/${d.getDate()}`; 
}

function changeWeek(offset) { 
    triggerHaptic(15); 
    currentWeekOffset += offset; 
    if (typeof renderSchedule === 'function') renderSchedule(); 
}

// 跳轉至當前選擇課表的第一天
window.jumpToCurrentScheduleStart = function() {
    triggerHaptic(15);
    const sch = getTargetSchedule();
    if (sch && sch.startDate) {
        const dateObj = parseLocalDate(sch.startDate);
        if (!isNaN(dateObj.getTime())) {
            customDpYear = dateObj.getFullYear();
            customDpMonth = dateObj.getMonth();
            
            // 直接呼叫 selectCustomDpDate 進行選取並自動關閉日曆視窗
            selectCustomDpDate(sch.startDate);
            
            // 如果原本在手動輸入模式，幫忙切回網格模式
            if (isCustomDpManual) {
                toggleCustomDpMode(false);
            }
        }
    }
};

// 自動偵測並展開彈跳視窗內的 textarea
window.autoExpandTextareasInModal = function() {
    setTimeout(() => {
        const textareas = document.querySelectorAll('#view-detail-modal textarea');
        textareas.forEach(ta => {
            ta.style.height = 'auto';
            ta.style.height = (ta.scrollHeight) + 'px';
        });
    }, 50);
};

window.jumpToDate = function(dateStr) {
    if (!dateStr) return;
    const targetDate = parseLocalDate(dateStr);
    
    // 計算目標日期的週一
    const targetMonday = getMondayOfWeek(targetDate, 0);
    // 計算今天日期的週一
    const todayMonday = getMondayOfWeek(new Date(), 0);
    
    // 計算相差的週數
    const diffTime = targetMonday.getTime() - todayMonday.getTime();
    const newOffset = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    currentWeekOffset = newOffset;
    if (typeof renderSchedule === 'function') renderSchedule();
    showToast("已跳轉至選擇的日期");
};

function resetCurrentWeek() { 
    triggerHaptic(15); 
    currentWeekOffset = 0; 
    if (typeof renderSchedule === 'function') renderSchedule(); 
}

// ========================================================
// 課表排程繪製 (原版與 24 小時)
// ========================================================

function handleSlotClick(day, periodId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        openLeaveNoteModal(day, periodId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const course = sch.courses ? sch.courses[`${day}_${periodId}`] : null; 
    openViewDetailModal("school", { day, periodId, course: course || {} }); 
}

function handleTutoringClick(tId) { 
    triggerHaptic(15); 
    const sch = getTargetSchedule(); // 改為 getTargetSchedule 以支援抓取好友資料
    const tut = (sch.tutorings || []).find((t) => t.id === tId); 
    if (isViewingFriend) { 
        openLeaveNoteModal(tut ? tut.day : "", tId); 
        return; 
    }
    if (tut) openViewDetailModal("tutoring", { tut }); 
}

function handleWorkClick(wId) { 
    triggerHaptic(15); 
    const sch = getTargetSchedule(); // 改為 getTargetSchedule 以支援抓取好友資料
    const work = (sch.works || []).find((w) => w.id === wId); 
    if (isViewingFriend) { 
        openLeaveNoteModal(work ? work.day : "", wId); 
        return; 
    }
    if (work) openViewDetailModal("work", { work }); 
}

function handleOverrideClick(ovrId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        openLeaveNoteModal("", ovrId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const ovr = (sch.overrides || []).find((o) => o.id === ovrId); 
    if (ovr) openViewDetailModal("override", { ovr }); 
}

function handleTempEventClick(tmpId) { 
    triggerHaptic(15); 
    if (isViewingFriend) { 
        const sch = getTargetSchedule(); 
        const tmp = sch.temporaryEvents.find(t => t.id === tmpId); 
        openLeaveNoteModal(tmp ? tmp.day : "", tmpId); 
        return; 
    } 
    const sch = getActiveSchedule(); 
    const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId); 
    if (tmp) openViewDetailModal("temp_event", { tmp }); 
}

function renderSchedule() { 
    // 👇 新增判斷「本週」按鈕是否要亮起 👇
    const btnCurrentWeek = document.getElementById("btn-current-week");
    if (btnCurrentWeek) {
        if (currentWeekOffset === 0) {
            btnCurrentWeek.classList.add("today");
        } else {
            btnCurrentWeek.classList.remove("today");
        }
    }
    
    if (state.is24HourMode) {
        render24HourSchedule(); 
    } else {
        renderOriginalSchedule(); 
    }
}

// 渲染重要日程跑馬燈/橫幅
function renderDeadlinesBanner() {
    const banner = document.getElementById("deadline-banner"); 
    
    if (state.showDeadlines === false || isViewingFriend) { 
        banner.style.display = "none"; 
        return; 
    }
    
    const sch = getActiveSchedule(); 
    let rawDl = []; 
    
    if (sch.courses) { 
        Object.keys(sch.courses).forEach(k => { 
            const c = sch.courses[k]; 
            if (c && c.deadlines) {
                c.deadlines.forEach(dl => { 
                    rawDl.push({ ...dl, courseName: c.name }); 
                });
            }
        }); 
    }

    if (sch.customCourses) { 
        sch.customCourses.forEach(c => { 
            if (c && c.deadlines) {
                c.deadlines.forEach(dl => { 
                    rawDl.push({ ...dl, courseName: c.name }); 
                });
            }
        }); 
    }
    
    const uniqueMap = {}; 
    let allDl = []; 
    
    rawDl.forEach(dl => { 
        const key = `${dl.courseName}_${dl.title}_${dl.date}`; 
        if (!uniqueMap[key]) { 
            uniqueMap[key] = true; 
            allDl.push(dl); 
        } 
    });
    
    const today = new Date(); 
    today.setHours(0, 0, 0, 0); 
    
    allDl = allDl.filter(dl => { 
        const dDate = parseLocalDate(dl.date); 
        dDate.setHours(0, 0, 0, 0); 
        return dDate >= today; 
    }); 
    
    allDl.sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    
    if (allDl.length === 0) { 
        banner.style.display = "none"; 
        return; 
    } 
    
    banner.style.display = "block";
    
    const urgentDl = []; 
    const normalDl = []; 
    
    allDl.forEach(dl => { 
        const d = parseLocalDate(dl.date); 
        d.setHours(0, 0, 0, 0); 
        const df = Math.round((d - today) / (1000 * 60 * 60 * 24)); 
        dl.diffDays = df; 
        dl.diffText = df === 0 ? "今天" : `${df} 天後`; 
        
        if (df < 7) {
            urgentDl.push(dl); 
        } else {
            normalDl.push(dl); 
        }
    });
    
    const headerTextEl = document.getElementById("deadline-closest-text"); 
    
    if (urgentDl.length > 0) { 
        headerTextEl.innerHTML = urgentDl.map(dl => 
            `距 [${escapeHtml(dl.courseName)}] ${escapeHtml(dl.title)} <span style="color:var(--primary); margin-left:4px;">${dl.diffText}</span>`
        ).join(''); 
    } else { 
        const closest = normalDl[0]; 
        headerTextEl.innerHTML = `距 [${escapeHtml(closest.courseName)}] ${escapeHtml(closest.title)} 還有 ${closest.diffDays} 天`; 
    }
    
    const listEl = document.getElementById("deadline-list"); 
    listEl.innerHTML = ""; 
    
    allDl.forEach(dl => { 
        const d = parseLocalDate(dl.date); 
        const item = document.createElement("div"); 
        item.className = "deadline-item"; 
        item.innerHTML = `<span><b>[${escapeHtml(dl.courseName)}]</b> ${escapeHtml(dl.title)}</span> <span style="color:var(--primary); font-weight:600;">${dl.diffText} (${formatShortDate(d)})</span>`; 
        listEl.appendChild(item); 
    });
}

function toggleDeadlineList() {
    const list = document.getElementById("deadline-list");
    const icon = document.getElementById("deadline-toggle-icon");
    if (list.classList.contains("active")) {
        list.classList.remove("active");
        icon.innerText = "▼ 展開全部";
    } else {
        list.classList.add("active");
        icon.innerText = "▲ 收起";
    }
}

// 產生格子的內部 HTML
function getDisplayHtml(item, type, weekKey, isMasked, seg) {
    if (isMasked) {
        return `<div class="item-title">忙碌中</div><div class="item-sub">不可見</div>`;
    }
    
    let badge = "";
    
    if (type === 'school') {
        if (!isViewingFriend && getActiveSchedule().weeklyMemos[weekKey] && getActiveSchedule().weeklyMemos[weekKey][`school_${item.key}`]) {
            badge = `<span class="memo-badge">📌</span>`;
        }
        let timeSub = "";
        // 隱藏一般課程本來不會顯示的時間（避免跟 Custom 衝突）
        if (item.course && item.course.isRegularSchool) {
             /* 不做任何顯示 */
        } else if (seg && (seg.renderStart || seg.startTime)) {
            const st = seg.renderStart || seg.startTime;
            const et = seg.renderEnd || seg.endTime;
            timeSub = `<div class="item-sub">${escapeHtml(st)} ~ ${escapeHtml(et)}</div>`;
        } else if (item.course && item.course.startTime) {
            timeSub = `<div class="item-sub">${escapeHtml(item.course.startTime)} ~ ${escapeHtml(item.course.endTime)}</div>`;
        }
        
        return `${badge}<div class="item-title">${escapeHtml(item.course.name)}</div>${timeSub}${item.course.room ? `<div class="item-sub">${escapeHtml(item.course.room)}</div>` : ""}`;
        
    } else if (type === 'tutoring') {
        if (!isViewingFriend && getActiveSchedule().weeklyMemos[weekKey] && getActiveSchedule().weeklyMemos[weekKey][`tut_${item.id}`]) {
            badge = `<span class="memo-badge">📌</span>`;
        }
        return `${badge}<div class="item-title">${escapeHtml(item.student)}</div><div class="item-sub">${escapeHtml(seg.startTime)}</div><div class="item-sub">${escapeHtml(seg.endTime)}</div>`;
        
    } else if (type === 'work') {
        return `<div class="item-title">${escapeHtml(item.name)}</div><div class="item-sub">${escapeHtml(seg.startTime)}</div><div class="item-sub">${escapeHtml(seg.endTime)}</div>`;
        
    } else if (type === 'override' || type === 'temp') {
        return `<div class="item-title">${escapeHtml(item.title)}</div>${item.location ? `<div class="item-sub">${escapeHtml(item.location)}</div>` : ""}`;
    }
}

// 計算行程重疊 (用於排版)
window.calculateOverlaps = function(gridArray) {
    gridArray.forEach(item => {
        // 💡 加入 overlapStart 與 overlapEnd 專供碰撞演算法使用
        item.sm = timeToMinutes(item.overlapStart || item.renderStart || item.startTime);
        let em = timeToMinutes(item.overlapEnd || item.renderEnd || item.endTime);
        if (item.sm > em) {
            em = 24 * 60; 
        }
        item.em = em;
    });
    
    gridArray.sort((a, b) => a.sm - b.sm || b.em - a.em);
    
    let columns = [];
    let lastEventEnding = null;
    
    const packEvents = (cols) => {
        const numCols = cols.length;
        const allInCluster = cols.flatMap(c => c);
        
        cols.forEach((col, colIdx) => {
            col.forEach(ev => {
                ev.colSpan = 1;
                for (let i = colIdx + 1; i < numCols; i++) {
                    if (cols[i].some(e => e.sm < ev.em && e.em > ev.sm)) break;
                    ev.colSpan++;
                }
                ev.widthPct = (ev.colSpan / numCols) * 100;
                ev.leftPct = (colIdx / numCols) * 100;
                
                const getEm = (item) => Math.max(item.em, item.sm + 1);
                ev.overlapGroup = allInCluster.filter(e => Math.max(ev.sm, e.sm) < Math.min(getEm(ev), getEm(e)));
            });
        });
    };

    gridArray.forEach(ev => {
        if (lastEventEnding !== null && ev.sm >= lastEventEnding) {
            packEvents(columns);
            columns = [];
            lastEventEnding = null;
        }
        
        let placed = false;
        for (let col of columns) {
            if (!col.some(e => e.sm < ev.em && e.em > ev.sm)) {
                col.push(ev);
                placed = true;
                break;
            }
        }
        
        if (!placed) { 
            columns.push([ev]); 
        }
        if (lastEventEnding === null || ev.em > lastEventEnding) { 
            lastEventEnding = ev.em; 
        }
    });
    
    if (columns.length > 0) {
        packEvents(columns);
    }
};

// 呼叫重疊選擇 Modal
window.openOverlapSelectionModal = function(group) {
    triggerHaptic(15);
    const listEl = document.getElementById("overlap-selection-list");
    if (!listEl) return;
    
    listEl.innerHTML = "";
    document.getElementById("overlap-selection-title").innerText = `${group.length} 筆行程時間重疊`;
    
    group.forEach(item => {
        const el = document.createElement("div");
        el.className = "settings-item";
        el.style.cssText = "border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;";
        
        let name = "";
        let sub = `${item.renderStart || item.startTime} ~ ${item.renderEnd || item.endTime}`;
        
        if (item.itemType === 'is-school') {
            const cName = item.course ? item.course.name : (item.name || "未知課程");
            name = `[課程] ${cName}`;
        } else if (item.itemType === 'is-tutoring') {
            name = `[家教] ${item.student}`;
        } else if (item.itemType === 'is-work') {
            name = `[工作] ${item.name}`;
        } else if (item.itemType === 'is-override-temp') {
            name = `[事件/調課] ${item.title}`;
        }
        
        el.innerHTML = `
            <div>
                <div style="font-weight:bold; font-size:0.9rem; color:var(--text);">${escapeHtml(name)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${escapeHtml(sub)}</div>
            </div>
            <div style="color:var(--primary); font-weight:bold; font-size:0.8rem; background:var(--table-th-bg); padding:4px 8px; border-radius:12px;">查看 ➔</div>
        `;
        
        el.onclick = () => {
            closeModal("overlap-selection-modal");
            item.clickFn(item.id);
        };
        listEl.appendChild(el);
    });
    
    document.getElementById("overlap-selection-modal").classList.add("active");
};

// ========================================================
// 繪製原版課表 (Render Original Schedule)
// ========================================================
function renderOriginalSchedule() {
    try {
        const sch = getActiveSchedule();
        const monday = getMondayOfWeek(new Date(), currentWeekOffset);
        const maxDays = state.showTutoring ? 7 : 5;
        const rangeEnd = new Date(monday); 
        rangeEnd.setDate(monday.getDate() + (maxDays - 1));
        const weekKey = getWeekKey(new Date());
        const alignClass = `align-${state.textAlign || "center"}`;
        
        document.getElementById("week-range-text").innerText = `${monday.getFullYear()} 年 ${formatShortDate(monday)} ~ ${formatShortDate(rangeEnd)}`;
        
        const tableEl = document.getElementById("schedule-table");
        if (tableEl) {
            tableEl.style.width = state.showTutoring ? "calc(48px + (100% - 48px) / 5 * 7)" : "100%";
        }
        
        const thead = document.getElementById("schedule-head"); 
        thead.innerHTML = ""; 
        const headTr = document.createElement("tr"); 
        headTr.innerHTML = `<th class="col-time">節次</th>`;
        
        const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
        const todayStr = formatDate(new Date());
        const weekDates = [];
        
        for (let i = 0; i < maxDays; i++) { 
            const curDate = new Date(monday); 
            curDate.setDate(monday.getDate() + i); 
            const dateStr = formatDate(curDate); 
            weekDates.push(dateStr); 
            
            const th = document.createElement("th"); 
            if (dateStr === todayStr) {
                th.className = "today-header"; 
            }
            th.innerHTML = `<div>${dayNames[i + 1]}</div><div style="font-size:0.62rem; font-weight:normal;">${formatShortDate(curDate)}</div>`; 
            headTr.appendChild(th); 
        }
        thead.appendChild(headTr); 
        
        const tbody = document.getElementById("schedule-body"); 
        tbody.innerHTML = "";
        
        const schStart = parseLocalDate(sch.startDate || "2026-09-07"); 
        const schEnd = parseLocalDate(sch.endDate || "2027-01-10"); 
        schStart.setHours(0, 0, 0, 0); 
        schEnd.setHours(23, 59, 59, 999);
        
        if (rangeEnd < schStart || monday > schEnd) { 
            tbody.innerHTML = `<tr><td colspan="${maxDays + 1}" style="text-align:center; padding:45px 15px; color:var(--text-muted); font-size:0.82rem;">⚠️ 本週不在當前課表有效範圍內。<br><span style="font-size:0.72rem; color:var(--primary);">請切換課表或調整時間範圍。</span></td></tr>`; 
            renderDeadlinesBanner(); 
            return; 
        }
        renderDeadlinesBanner();

        const periodsToRender = (sch.periods || initialDefaultPeriods).filter((p) => !p.optional || state.showLatePeriods);
        const currentWeekTempEvents = (sch.temporaryEvents || []).filter((t) => t.weekKey === weekKey);
        const hasNoonEvents = currentWeekTempEvents.some((t) => t.slotType === "noon");
        const currentWeekWorks = (sch.works || []).filter((w) => w.type !== "weekly" || w.weekKey === weekKey);
        
        const firstPeriodStartMins = periodsToRender.length > 0 ? timeToMinutes(periodsToRender[0].start) : 8 * 60;
        const lastPeriodEndMins = periodsToRender.length > 0 ? timeToMinutes(periodsToRender[periodsToRender.length - 1].end) : 17 * 60;
        
        const weekStart = new Date(monday);
        const weekEnd = new Date(monday);
        weekEnd.setDate(monday.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // 【修復 1】將調課分為「目標是本週 (渲染用)」與「來源是本週 (隱藏原課程用)」
        const currentWeekOverrides = (sch.overrides || []).filter(o => {
            const td = parseLocalDate(o.targetDate);
            return td >= weekStart && td <= weekEnd;
        });

        const sourceThisWeekOverrides = (sch.overrides || []).filter(o => {
            // 兼容舊資料：若沒有 sourceDate，退回使用 targetDate
            const sd = o.sourceDate ? parseLocalDate(o.sourceDate) : parseLocalDate(o.targetDate);
            return sd >= weekStart && sd <= weekEnd;
        });

        // 隱藏原課程的判斷改用 sourceThisWeekOverrides
        const overriddenSourceIds = new Set(sourceThisWeekOverrides.map((o) => o.sourceId));
        const overriddenCourseKeys = new Set(sourceThisWeekOverrides.filter((o) => o.type === "school").map((o) => o.sourceKey));

        const combinedGrid = Array.from({ length: maxDays + 1 }, () => []);
        const morningGrid = Array.from({ length: maxDays + 1 }, () => []); 
        const daytimeGrid = Array.from({ length: maxDays + 1 }, () => []);
        const eveningGrid = Array.from({ length: maxDays + 1 }, () => []);
        let hasMorningEvents = false; 

        for (let d = 1; d <= maxDays; d++) {
            const cellDateObj = new Date(monday); 
            cellDateObj.setDate(monday.getDate() + (d - 1)); 
            
            const nextDateObj = new Date(cellDateObj); 
            nextDateObj.setDate(cellDateObj.getDate() + 1); 
            
            const prevDateObj = new Date(cellDateObj); 
            prevDateObj.setDate(cellDateObj.getDate() - 1);
            
            const dStr = formatDate(cellDateObj); 
            const nextDStr = formatDate(nextDateObj); 
            const prevDStr = formatDate(prevDateObj); 
            
            let nextD = d === 7 ? 1 : d + 1; 
            let prevD = d === 1 ? 7 : d - 1;
            
            const processEvent = (item, itemDay, itemDateStr, clickFn, getInnerHtml, defBgVar, defTextVar, itemType) => {
                let sm = timeToMinutes(item.startTime); 
                let em = timeToMinutes(item.endTime); 
                let isCross = sm > em;
                
                let matchesToday = itemDateStr ? (itemDateStr === dStr) : (Number(itemDay) === d);
                let matchesPrevDay = itemDateStr ? (itemDateStr === prevDStr) : (Number(itemDay) === prevD);
                
                let renderStart = null;
                let renderEnd = null;

                if (matchesToday) {
                    renderStart = item.startTime;
                    renderEnd = isCross ? "24:00" : item.endTime;
                } else if (matchesPrevDay && isCross && em > 0) {
                    renderStart = "00:00";
                    renderEnd = item.endTime;
                }

                if (renderStart !== null && renderEnd !== null) {
                    let rsm = timeToMinutes(renderStart);
                    let rem = timeToMinutes(renderEnd);
                    
                    if (renderStart === "24:00") rsm = 24 * 60;
                    if (renderEnd === "24:00") rem = 24 * 60;

                    let overlapStart = renderStart;
                    let overlapEnd = renderEnd;

                    if (rem > lastPeriodEndMins || rsm >= lastPeriodEndMins) {
                        overlapEnd = "24:00";
                    }
                    if (rsm < firstPeriodStartMins) {
                        overlapStart = "00:00";
                    }

                    combinedGrid[d].push({ 
                        ...item, 
                        clickFn, 
                        getInnerHtml, 
                        defBgVar, 
                        defTextVar, 
                        itemType, 
                        renderStart, 
                        renderEnd, 
                        overlapStart, 
                        overlapEnd 
                    });
                }
            };
            
            (sch.periods || initialDefaultPeriods).forEach(p => {
                const key = `${d}_${p.id}`;
                const course = sch.courses ? sch.courses[key] : null;
                if (course && course.name && !overriddenCourseKeys.has(key)) {
                    const courseCopy = { ...course, isRegularSchool: true };
                    const proxyCourse = { 
                        key, 
                        course: courseCopy, 
                        id: key, 
                        startTime: p.start, 
                        endTime: p.end, 
                        color: course.color, 
                        isMasked: course.isMasked 
                    };
                    const clickFn = () => handleSlotClick(d, p.id);
                    processEvent(proxyCourse, d, null, clickFn, (i) => getDisplayHtml(i, 'school', weekKey, isViewingFriend && i.isMasked, i) + getNoteBadgeHtml(d, p.id), "--school-def-bg", "--school-def-text", "is-school");
                }
            });

            (sch.tutorings || []).forEach(t => { 
                if (!overriddenSourceIds.has(t.id)) {
                    processEvent(t, t.day, null, handleTutoringClick, (i) => getDisplayHtml(t, 'tutoring', weekKey, isViewingFriend && t.isMasked, i) + getNoteBadgeHtml(t.day, t.id), "--tutoring-def-bg", "--tutoring-def-text", "is-tutoring"); 
                }
            });
            
            currentWeekWorks.forEach(w => { 
                if (!overriddenSourceIds.has(w.id)) {
                    processEvent(w, w.day, null, handleWorkClick, (i) => getDisplayHtml(w, 'work', weekKey, isViewingFriend && w.isMasked, i) + getNoteBadgeHtml(w.day, w.id), "--tutoring-def-bg", "--tutoring-def-text", "is-work"); 
                }
            });
            
            (sch.customCourses || []).forEach(c => { 
                if (!overriddenCourseKeys.has(`${c.day}_${c.id}`)) {
                    const proxyCourse = { key: `${c.day}_${c.id}`, course: c };
                    const clickFn = () => handleSlotClick(c.day, c.id);
                    processEvent(c, c.day, null, clickFn, (i) => getDisplayHtml(proxyCourse, 'school', weekKey, isViewingFriend && c.isMasked, i) + getNoteBadgeHtml(c.day, c.id), "--school-def-bg", "--school-def-text", "is-school"); 
                }
            });
            
            currentWeekOverrides.forEach(o => { 
                processEvent(o, null, o.targetDate, handleOverrideClick, (i) => getDisplayHtml(o, 'override', weekKey, false, i), "--override-temp-def-bg", "--override-temp-def-text", "is-override-temp"); 
            });
            
            currentWeekTempEvents.forEach(t => { 
                let st = t.startTime, et = t.endTime; 
                // 💡 解除限制，讓中午事件進入全日計算
                if (t.slotType === "noon") { 
                    st = "12:00"; 
                    et = "13:00"; 
                } else if (t.slotType === "period") { 
                    const spObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === String(t.periodId)); 
                    if (spObj) { 
                        st = spObj.start; 
                        et = spObj.end; 
                    } 
                } 
                const proxyItem = { ...t, startTime: st || "12:00", endTime: et || "13:00" }; 
                processEvent(proxyItem, t.day, null, handleTempEventClick, (i) => getDisplayHtml(t, 'temp', weekKey, false, i) + getNoteBadgeHtml(t.day, t.id), "--override-temp-def-bg", "--override-temp-def-text", "is-override-temp"); 
            });

            window.calculateOverlaps(combinedGrid[d]);

            combinedGrid[d].forEach(item => {
                let rsm = timeToMinutes(item.renderStart);
                let rem = timeToMinutes(item.renderEnd);
                
                if (rsm > rem) rem = 24 * 60;
                if (item.renderStart === "24:00") rsm = 24 * 60;
                if (item.renderEnd === "24:00") rem = 24 * 60;

                item.isMorningStart = rsm < firstPeriodStartMins;
                item.isDaytimeStart = rsm >= firstPeriodStartMins && rsm < lastPeriodEndMins;
                item.isEveningStart = rsm >= lastPeriodEndMins;

                if (rsm < firstPeriodStartMins) {
                    morningGrid[d].push(item);
                    hasMorningEvents = true; 
                }
                if (rem > firstPeriodStartMins && rsm < lastPeriodEndMins) {
                    daytimeGrid[d].push(item);
                }
                if (rem > lastPeriodEndMins || rsm >= lastPeriodEndMins) {
                    eveningGrid[d].push(item);
                }
            });
        }

        const fragment = document.createDocumentFragment();

        if (hasMorningEvents) {
            const morningTr = document.createElement("tr"); 
            morningTr.className = "morning-row";
            morningTr.innerHTML = `<td class="col-time"><div>晨間</div><div style="color:var(--text-muted); font-size:0.58rem;">早修</div></td>`;
            
            for (let d = 1; d <= maxDays; d++) {
                const td = document.createElement("td");
                const morningCell = document.createElement("div"); 
                morningCell.className = "noon-cell"; 
                
                if (morningGrid[d].length > 0) {
                    const wrapper = document.createElement("div"); 
                    wrapper.className = "table-col-wrapper";
                    
                    const overlayContainer = document.createElement("div"); 
                    overlayContainer.className = "col-overlay-container";
                    
                    morningGrid[d].forEach(item => {
                        let em = timeToMinutes(item.renderEnd);
                        if (item.renderEnd === "24:00") em = 24 * 60;
                        
                        const extendsToDaytime = em > firstPeriodStartMins;
                        const extendsToEvening = em > lastPeriodEndMins;
                        
                        let cardTop = 0;
                        let cardHeight = CELL_HEIGHT - 4;
                        let radiusStyle = "";
                        
                        if (extendsToDaytime) {
                            const daytimePx = timeToPixelOffset(em, periodsToRender, hasNoonEvents);
                            cardHeight = CELL_HEIGHT + daytimePx - 4;
                            radiusStyle = "border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-width: 0; z-index: 30;";
                            if (extendsToEvening && state.showTutoring) {
                                cardHeight += CELL_HEIGHT;
                            }
                        }
                        
                        const floatCard = document.createElement("div"); 
                        floatCard.className = `tutoring-float-card ${item.itemType} ${alignClass}`;
                        
                        const styleColor = (!isViewingFriend || !item.isMasked) && item.color 
                            ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` 
                            : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`;
                        
                        floatCard.style.cssText = `${styleColor} ${radiusStyle} top: ${cardTop}px; height: ${cardHeight}px; left: calc(${item.leftPct || 0}% + 1px); width: calc(${item.widthPct || 100}% - 2px);`; 
                        
                        if (item.isMorningStart) {
                            floatCard.onclick = (e) => { 
                                e.stopPropagation(); 
                                if (item.overlapGroup && item.overlapGroup.length > 1) {
                                    openOverlapSelectionModal(item.overlapGroup);
                                } else {
                                    item.clickFn(item.id); 
                                }
                            }; 
                            floatCard.innerHTML = item.getInnerHtml(item); 
                        } else {
                            floatCard.style.opacity = "0";
                            floatCard.style.pointerEvents = "none";
                        }
                        overlayContainer.appendChild(floatCard);
                    });
                    
                    wrapper.appendChild(overlayContainer);
                    morningCell.appendChild(wrapper);
                } else {
                    morningCell.innerHTML = `<span class="evening-empty">-</span>`;
                }
                
                td.appendChild(morningCell); 
                morningTr.appendChild(td);
            }
            fragment.appendChild(morningTr);
        }

        periodsToRender.forEach((p, pIdx) => {
            const tr = document.createElement("tr");
            const timeTh = document.createElement("td"); 
            timeTh.className = "col-time"; 
            timeTh.innerHTML = `<div>${escapeHtml(p.name)}</div><div style="color:var(--text-muted); font-size:0.58rem;">${escapeHtml(p.start)}</div>`; 
            tr.appendChild(timeTh);
            
            for (let d = 1; d <= maxDays; d++) {
                const td = document.createElement("td");
                const wrapper = document.createElement("div"); 
                wrapper.className = "table-col-wrapper"; 
                
                const slotDiv = document.createElement("div"); 
                slotDiv.className = "cell-slot";
                
                const noteBadge = getNoteBadgeHtml(d, p.id);
                
                slotDiv.onclick = (e) => { 
                    e.stopPropagation(); 
                    handleSlotClick(d, p.id); 
                };
                const currentCellDateStr = weekDates[d - 1];
                if (isViewingFriend && showIntersection && isMyTimeFree(d, timeToMinutes(p.start), timeToMinutes(p.end), currentCellDateStr)) {
                    slotDiv.style.background = "#dcfce7"; 
                    slotDiv.style.border = "1px solid #22c55e";
                }
                
                slotDiv.innerHTML = `<span style="color:var(--border); font-size:0.75rem;">+</span>${noteBadge}`;
                wrapper.appendChild(slotDiv);

                if (pIdx === 0) {
                    const overlayContainer = document.createElement("div"); 
                    overlayContainer.className = "col-overlay-container";
                    
                    daytimeGrid[d].forEach(item => {
                        const sm = timeToMinutes(item.renderStart); 
                        let em = timeToMinutes(item.renderEnd); 
                        if (sm > em) em = 24 * 60; 
                        
                        const topPx = timeToPixelOffset(sm, periodsToRender, hasNoonEvents);
                        const bottomPx = timeToPixelOffset(em, periodsToRender, hasNoonEvents);
                        const extendsToEvening = em > lastPeriodEndMins; 
                        
                        let cardTop = topPx + 2; 
                        let cardHeight = Math.max(bottomPx - topPx, 20) - 4; 
                        let radiusStyle = "";
                        const containerHeight = periodsToRender.length * CELL_HEIGHT + (hasNoonEvents ? CELL_HEIGHT : 0);
                        
                        if (extendsToEvening) { 
                            if (state.showTutoring) { 
                                cardHeight = (bottomPx - topPx) + CELL_HEIGHT - 4; 
                                radiusStyle = "z-index: 20;"; 
                            } else { 
                                radiusStyle = "border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-width: 0; box-shadow: 0 -1px 2px rgba(0,0,0,0.06); z-index: 20;"; 
                                if (cardTop + cardHeight > containerHeight) { 
                                    cardTop = containerHeight - cardHeight; 
                                } 
                            } 
                        } else { 
                            if (cardTop + cardHeight > containerHeight) { 
                                cardTop = containerHeight - cardHeight; 
                            } 
                        }
                        
                        const floatCard = document.createElement("div"); 
                        floatCard.className = `tutoring-float-card ${item.itemType} ${alignClass}`;
                        
                        const styleColor = (!isViewingFriend || !item.isMasked) && item.color 
                            ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` 
                            : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`;
                        
                        floatCard.style.cssText = `${styleColor} top: ${cardTop}px; height: ${cardHeight}px; left: calc(${item.leftPct || 0}% + 1px); width: calc(${item.widthPct || 100}% - 2px); ${radiusStyle}`;
                        
                        if (!item.isDaytimeStart) {
                            floatCard.style.opacity = "0";
                            floatCard.style.pointerEvents = "none";
                        } else {
                            floatCard.onclick = (e) => { 
                                e.stopPropagation(); 
                                if (item.overlapGroup && item.overlapGroup.length > 1) {
                                    openOverlapSelectionModal(item.overlapGroup);
                                } else {
                                    item.clickFn(item.id); 
                                }
                            }; 
                            floatCard.innerHTML = item.getInnerHtml(item); 
                        }
                        overlayContainer.appendChild(floatCard);
                    });
                    wrapper.appendChild(overlayContainer);
                }
                
                td.appendChild(wrapper); 
                tr.appendChild(td);
            }
            fragment.appendChild(tr);

            if (p.id === 4 && hasNoonEvents) {
                const noonTr = document.createElement("tr"); 
                noonTr.className = "noon-row"; 
                noonTr.innerHTML = `<td class="col-time"><div>中午</div><div style="color:var(--text-muted); font-size:0.58rem;">午休</div></td>`;
                
                for (let d = 1; d <= maxDays; d++) {
                    const td = document.createElement("td"); 
                    const noonCell = document.createElement("div"); 
                    noonCell.className = "noon-cell";
                    // 💡 將單獨算碰撞的中午迴圈移除，由 daytimeGrid 統一接管排版！
                    noonCell.innerHTML = `<span class="noon-empty">-</span>`; 
                    td.appendChild(noonCell); 
                    noonTr.appendChild(td);
                }
                fragment.appendChild(noonTr);
            }
        });

        if (state.showTutoring) {
            const eveningTr = document.createElement("tr"); 
            eveningTr.className = "evening-row"; 
            eveningTr.innerHTML = `<td class="col-time"><div>課後</div><div style="color:var(--text-muted); font-size:0.58rem;">夜間</div></td>`;
            
            for (let d = 1; d <= maxDays; d++) {
                const td = document.createElement("td"); 
                const eveningCell = document.createElement("div"); 
                eveningCell.className = "evening-cell"; 
                
                if (eveningGrid[d].length > 0) {
                    const wrapper = document.createElement("div"); 
                    wrapper.className = "table-col-wrapper";
                    const overlayContainer = document.createElement("div"); 
                    overlayContainer.className = "col-overlay-container";
                    
                    eveningGrid[d].forEach(item => {
                        let radiusStyle = !item.isEveningStart ? "border-top-left-radius: 0; border-top-right-radius: 0; border-top: none;" : "";
                        
                        const floatCard = document.createElement("div"); 
                        floatCard.className = `tutoring-float-card ${item.itemType} ${alignClass}`;
                        
                        const styleColor = (!isViewingFriend || !item.isMasked) && item.color 
                            ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` 
                            : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`;
                        
                        floatCard.style.cssText = `${styleColor} ${radiusStyle} top: 0px; height: 100%; left: calc(${item.leftPct || 0}% + 1px); width: calc(${item.widthPct || 100}% - 2px);`; 
                        
                        if (!item.isEveningStart) {
                            floatCard.style.opacity = "0";
                            floatCard.style.pointerEvents = "none";
                        } else {
                            floatCard.onclick = (e) => { 
                                e.stopPropagation(); 
                                if (item.overlapGroup && item.overlapGroup.length > 1) {
                                    openOverlapSelectionModal(item.overlapGroup);
                                } else {
                                    item.clickFn(item.id); 
                                }
                            }; 
                            floatCard.innerHTML = item.getInnerHtml(item); 
                        }
                        overlayContainer.appendChild(floatCard);
                    });
                    
                    wrapper.appendChild(overlayContainer);
                    eveningCell.appendChild(wrapper);
                } else {
                    eveningCell.innerHTML = `<span class="evening-empty">無夜間行程</span>`;
                }
                
                td.appendChild(eveningCell); 
                eveningTr.appendChild(td);
            }
            fragment.appendChild(eveningTr);
        }
        
        tbody.appendChild(fragment);
        
    } catch (err) { 
        console.error("渲染一般課表失敗:", err); 
        showToast("渲染課表時發生錯誤", "error"); 
    }
}

// ========================================================
// 繪製 24 小時制課表 (Render 24 Hour Schedule)
// ========================================================
function render24HourSchedule() {
    try {
        const sch = getActiveSchedule();
        const monday = getMondayOfWeek(new Date(), currentWeekOffset);
        const maxDays = state.showTutoring ? 7 : 5;
        const rangeEnd = new Date(monday); 
        rangeEnd.setDate(monday.getDate() + (maxDays - 1));
        const weekKey = getWeekKey(new Date());
        const alignClass = `align-${state.textAlign || "center"}`;
        
        document.getElementById("week-range-text").innerText = `${monday.getFullYear()} 年 ${formatShortDate(monday)} ~ ${formatShortDate(rangeEnd)}`;
        
        const tableEl = document.getElementById("schedule-table"); 
        if (tableEl) {
            tableEl.style.width = state.showTutoring ? "calc(48px + (100% - 48px) / 5 * 7)" : "100%";
        }
        
        const thead = document.getElementById("schedule-head"); 
        thead.innerHTML = ""; 
        const headTr = document.createElement("tr"); 
        headTr.innerHTML = `<th class="col-time">時間</th>`;
        
        const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
        const todayStr = formatDate(new Date()); 
        const weekDates = [];
        
        for (let i = 0; i < maxDays; i++) { 
            const curDate = new Date(monday); 
            curDate.setDate(monday.getDate() + i); 
            const dateStr = formatDate(curDate); 
            weekDates.push(dateStr); 
            
            const th = document.createElement("th"); 
            if (dateStr === todayStr) {
                th.className = "today-header"; 
            }
            th.innerHTML = `<div>${dayNames[i + 1]}</div><div style="font-size:0.62rem; font-weight:normal;">${formatShortDate(curDate)}</div>`; 
            headTr.appendChild(th); 
        }
        thead.appendChild(headTr); 
        
        const tbody = document.getElementById("schedule-body"); 
        tbody.innerHTML = "";
        
        const schStart = parseLocalDate(sch.startDate || "2026-09-07"); 
        const schEnd = parseLocalDate(sch.endDate || "2027-01-10"); 
        schStart.setHours(0, 0, 0, 0); 
        schEnd.setHours(23, 59, 59, 999);
        
        if (rangeEnd < schStart || monday > schEnd) { 
            tbody.innerHTML = `<tr><td colspan="${maxDays + 1}" style="text-align:center; padding:45px 15px; color:var(--text-muted); font-size:0.82rem;">⚠️ 本週不在當前課表有效範圍內。<br><span style="font-size:0.72rem; color:var(--primary);">請切換課表或調整時間範圍。</span></td></tr>`; 
            renderDeadlinesBanner(); 
            return; 
        }
        renderDeadlinesBanner();

        const periods24 = Array.from({length: 24}, (_, i) => ({ 
            id: `h${i}`, 
            name: `${i}:00`, 
            start: `${String(i).padStart(2, '0')}:00`, 
            end: `${String(i + 1).padStart(2, '0')}:00` 
        }));
        
        const currentWeekTempEvents = (sch.temporaryEvents || []).filter((t) => t.weekKey === weekKey);
        const currentWeekWorks = (sch.works || []).filter((w) => w.type !== "weekly" || w.weekKey === weekKey);
        
        // 同步修正 24H 版本的 Override 當週篩選邏輯
        const weekStart = new Date(monday);
        const weekEnd = new Date(monday);
        weekEnd.setDate(monday.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // 【修復 1】將調課分為「目標是本週 (渲染用)」與「來源是本週 (隱藏原課程用)」
        const currentWeekOverrides = (sch.overrides || []).filter(o => {
            const td = parseLocalDate(o.targetDate);
            return td >= weekStart && td <= weekEnd;
        });

        const sourceThisWeekOverrides = (sch.overrides || []).filter(o => {
            // 兼容舊資料：若沒有 sourceDate，退回使用 targetDate
            const sd = o.sourceDate ? parseLocalDate(o.sourceDate) : parseLocalDate(o.targetDate);
            return sd >= weekStart && sd <= weekEnd;
        });

        // 隱藏原課程的判斷改用 sourceThisWeekOverrides
        const overriddenSourceIds = new Set(sourceThisWeekOverrides.map((o) => o.sourceId));
        const overriddenCourseKeys = new Set(sourceThisWeekOverrides.filter((o) => o.type === "school").map((o) => o.sourceKey));

        const fragment = document.createDocumentFragment();

        periods24.forEach((p, pIdx) => {
            const tr = document.createElement("tr"); 
            const timeTh = document.createElement("td"); 
            timeTh.className = "col-time"; 
            timeTh.innerHTML = `<div>${escapeHtml(p.name)}</div>`; 
            tr.appendChild(timeTh);
            
            for (let d = 1; d <= maxDays; d++) {
                const td = document.createElement("td"); 
                const currentCellDateStr = weekDates[d - 1];
                const wrapper = document.createElement("div"); 
                wrapper.className = "table-col-wrapper";
                
                const slotDiv = document.createElement("div"); 
                slotDiv.className = "cell-slot"; 
                slotDiv.innerHTML = `<span style="color:transparent; font-size:0.75rem;">+</span>`; 
                wrapper.appendChild(slotDiv);
                
                const noteBadge = getNoteBadgeHtml(d, p.id);
                
                if (isViewingFriend && showIntersection && isMyTimeFree(d, timeToMinutes(p.start), timeToMinutes(p.end), currentCellDateStr)) {
                    slotDiv.style.background = "#dcfce7"; 
                    slotDiv.style.border = "1px solid #22c55e";
                }
                
                slotDiv.onclick = (e) => { 
                    e.stopPropagation(); 
                    showToast("24小時模式下，請使用右下角「+」新增事件", "error");
                };
                slotDiv.innerHTML += noteBadge;

                if (pIdx === 0) {
                    const overlayContainer = document.createElement("div"); 
                    overlayContainer.className = "col-overlay-container"; 
                    overlayContainer.style.height = `${24 * CELL_HEIGHT}px`;
                    
                    const renderList = []; 
                    
                    const prevCellDateObj = new Date(monday); 
                    prevCellDateObj.setDate(monday.getDate() + (d - 1) - 1); 
                    const prevCellDateStr = formatDate(prevCellDateObj); 
                    const prevD = d === 1 ? 7 : d - 1;

                    const addSegments = (item, itemDay, itemDate, clickFn, getInnerHtml, defBgVar, defTextVar, itemType) => {
                        const sm = timeToMinutes(item.startTime || "00:00"); 
                        const em = timeToMinutes(item.endTime || "00:00"); 
                        const isCross = sm > em; 
                        let segments = [];
                        
                        if (itemDate !== undefined) { 
                            if (itemDate === currentCellDateStr && !isCross) {
                                segments.push({ ...item }); 
                            }
                            if (itemDate === currentCellDateStr && isCross) {
                                segments.push({ ...item, endTime: "24:00", isStartSegment: true }); 
                            }
                            if (itemDate === prevCellDateStr && isCross) {
                                segments.push({ ...item, startTime: "00:00", isEndSegment: true }); 
                            }
                        } else { 
                            if (Number(itemDay) === d && !isCross) {
                                segments.push({ ...item }); 
                            }
                            if (Number(itemDay) === d && isCross) {
                                segments.push({ ...item, endTime: "24:00", isStartSegment: true }); 
                            }
                            if (Number(itemDay) === prevD && isCross) {
                                segments.push({ ...item, startTime: "00:00", isEndSegment: true }); 
                            }
                        }
                        
                        segments.forEach(seg => { 
                            const b = getNoteBadgeHtml(itemDay || d, item.id);
                            renderList.push({ 
                                ...seg, // 👉 關鍵修復：把原始的 student, name, title 一起塞入
                                course: seg, // 支援 customCourse
                                color: (isViewingFriend && item.isMasked) ? null : seg.color, 
                                startTime: seg.startTime, 
                                endTime: seg.endTime, 
                                itemType: itemType, 
                                clickFn: () => clickFn(item.id), 
                                innerHtml: getInnerHtml(seg) + b, 
                                defBgVar, 
                                defTextVar, 
                                isStartSegment: seg.isStartSegment, 
                                isEndSegment: seg.isEndSegment 
                            }); 
                        });
                    };

                    const dayCourses = []; 
                    
                    (sch.periods || initialDefaultPeriods).forEach(sp => { 
                        const key = `${d}_${sp.id}`; 
                        const course = sch.courses ? sch.courses[key] : null; 
                        if (course && course.name && !overriddenCourseKeys.has(key)) { 
                            dayCourses.push({ sp: { ...sp }, course, key }); 
                        } 
                    });
                    
                    const mergedCourses = []; 
                    dayCourses.forEach(curr => { 
                        if (mergedCourses.length > 0) { 
                            const last = mergedCourses[mergedCourses.length - 1]; 
                            if (last.course.name === curr.course.name && last.sp.end === curr.sp.start) { 
                                last.sp.end = curr.sp.end; 
                                return; 
                            } 
                        } 
                        mergedCourses.push(curr); 
                    });
                    
                    mergedCourses.forEach(item => { 
                        const msk = isViewingFriend && item.course.isMasked; 
                        renderList.push({ 
                            course: item.course, // 👉 關鍵修復：傳入原始 course 物件供 Modal 讀取
                            color: msk ? null : item.course.color, 
                            startTime: item.sp.start, 
                            endTime: item.sp.end, 
                            itemType: 'is-school', 
                            clickFn: () => handleSlotClick(d, item.sp.id), 
                            innerHtml: getDisplayHtml(item, 'school', weekKey, msk, null), 
                            defBgVar: '--school-def-bg', 
                            defTextVar: '--school-def-text' 
                        }); 
                    });
                    
                    (sch.customCourses || []).forEach(c => { 
                        if (overriddenCourseKeys.has(`${c.day}_${c.id}`)) return; 
                        addSegments(c, c.day, undefined, 
                            () => handleSlotClick(c.day, c.id), 
                            (seg) => getDisplayHtml({ key: `${c.day}_${c.id}`, course: c }, 'school', weekKey, isViewingFriend && c.isMasked, null), 
                            '--school-def-bg', '--school-def-text', 'is-school'
                        ); 
                    });
                    
                    (sch.tutorings || []).forEach(t => { 
                        if (overriddenSourceIds.has(t.id)) return; 
                        addSegments(t, t.day, undefined, handleTutoringClick, (seg) => getDisplayHtml(t, 'tutoring', weekKey, isViewingFriend && t.isMasked, seg), '--tutoring-def-bg', '--tutoring-def-text', 'is-tutoring'); 
                    });
                    
                    currentWeekWorks.forEach(w => { 
                        if (overriddenSourceIds.has(w.id)) return; 
                        addSegments(w, w.day, undefined, handleWorkClick, (seg) => getDisplayHtml(w, 'work', weekKey, isViewingFriend && w.isMasked, seg), '--tutoring-def-bg', '--tutoring-def-text', 'is-work'); 
                    });
                    
                    // 只顯示當週的 Override
                    currentWeekOverrides.forEach(o => { 
                        addSegments(o, undefined, o.targetDate, handleOverrideClick, (seg) => getDisplayHtml(o, 'override', weekKey, false, seg), '--override-temp-def-bg', '--override-temp-def-text', 'is-override-temp'); 
                    });
                    
                    currentWeekTempEvents.forEach(t => { 
                        let st = t.startTime, et = t.endTime; 
                        
                        if (t.slotType === "noon") { 
                            st = "12:00"; 
                            et = "13:00"; 
                        } 
                        if (t.slotType === "period") { 
                            const spObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === String(t.periodId)); 
                            if (spObj) { 
                                st = spObj.start; 
                                et = spObj.end; 
                            } 
                        } 
                        
                        const proxyItem = { ...t, startTime: st || "12:00", endTime: et || "13:00" }; 
                        addSegments(proxyItem, t.day, undefined, handleTempEventClick, (seg) => getDisplayHtml(t, 'temp', weekKey, false, seg), '--override-temp-def-bg', '--override-temp-def-text', 'is-override-temp'); 
                    });

                    window.calculateOverlaps(renderList);
                    
                    renderList.forEach(item => {
                        const sm = timeToMinutes(item.startTime); 
                        const em = timeToMinutes(item.endTime === "24:00" ? "24:00" : item.endTime); 
                        const topPx = timeToPixelOffset(sm, periods24); 
                        const bottomPx = timeToPixelOffset(em, periods24);
                        
                        let cardTop = topPx + 2; 
                        let cardHeight = Math.max(bottomPx - topPx, 20) - 4; 
                        let radiusStyle = "";
                        
                        if (item.isStartSegment) { 
                            radiusStyle = "border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom: none;"; 
                            cardHeight = Math.max(bottomPx - topPx, 20) - 2; 
                        }
                        if (item.isEndSegment) { 
                            radiusStyle = "border-top-left-radius: 0; border-top-right-radius: 0; border-top: none;"; 
                            cardTop = topPx; 
                            cardHeight = Math.max(bottomPx - topPx, 20) - 2; 
                        }
                        
                        const containerHeight = 24 * CELL_HEIGHT; 
                        if (cardTop + cardHeight > containerHeight) { 
                            cardTop = containerHeight - cardHeight; 
                        }
                        
                        const floatCard = document.createElement("div"); 
                        floatCard.className = `tutoring-float-card ${item.itemType} ${alignClass}`;
                        
                        const colorStyle = item.color 
                            ? `background-color: ${item.color}; color: ${getTextColorForBg(item.color)};` 
                            : `background-color: var(${item.defBgVar}); color: var(${item.defTextVar});`;
                        
                        // 追加 left 與 width 分割樣式
                        floatCard.style.cssText = `${colorStyle} top: ${cardTop}px; height: ${cardHeight}px; left: calc(${item.leftPct || 0}% + 1px); width: calc(${item.widthPct || 100}% - 2px); ${radiusStyle}`;
                        
                        floatCard.onclick = (e) => { 
                            e.stopPropagation(); 
                            if (item.overlapGroup && item.overlapGroup.length > 1) {
                                openOverlapSelectionModal(item.overlapGroup);
                            } else {
                                item.clickFn(item.id); 
                            }
                        }; 
                        
                        floatCard.innerHTML = item.innerHtml; 
                        overlayContainer.appendChild(floatCard);
                    });
                    
                    wrapper.appendChild(overlayContainer);
                }
                
                td.appendChild(wrapper); 
                tr.appendChild(td);
            }
            fragment.appendChild(tr);
        });
        tbody.appendChild(fragment);
        
    } catch (err) { 
        console.error("渲染 24 小時制課表失敗:", err); 
        showToast("渲染 24 小時課表時發生錯誤", "error"); 
    }
}
// ========================================================
// 檢視與詳細資料 Modal
// ========================================================

function openViewDetailModal(type, payload, activeTab = 'info') {
    const sch = getActiveSchedule();
    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"]; 
    const titleEl = document.getElementById("view-detail-title");
    const bodyEl = document.getElementById("view-detail-body");
    const switchBtn = document.getElementById("btn-switch-to-edit");
    const revertBtn = document.getElementById("btn-revert-override"); 
    
    revertBtn.style.display = "none"; 
    switchBtn.style.display = "inline-flex"; 
    currentViewingOverrideId = null; 
    currentViewingTempEventId = null; 
    const weekKey = getWeekKey(new Date());

    let course = null;
    let timeText = "";
    let infoHtml = "";
    let notesHtml = "";
    let attendanceHtml = "";
    let hasTabs = false;
    let courseKey = "";
    let overrideObj = null;

    if (type === "school") {
        course = payload.course;
        const { day, periodId } = payload;
        courseKey = `${day}_${periodId}`;
        
        if ((!course || !course.name) && String(periodId).startsWith("custom_")) {
            course = (sch.customCourses || []).find(c => c.id === periodId) || {};
        }

        titleEl.innerText = course.name || "空堂";
        if (String(periodId).startsWith("custom_")) {
            timeText = `${dayNames[Number(day)]} ${course.startTime || ''} ~ ${course.endTime || ''}`;
        } else {
            timeText = `${dayNames[Number(day)]} 第 ${periodId} 節`;
        }
        
        hasTabs = true;
        switchBtn.onclick = () => { 
            closeModal("view-detail-modal"); 
            openSchoolModal(day, periodId); 
        };

    } else if (type === "override") {
        overrideObj = payload.ovr;
        currentViewingOverrideId = overrideObj.id;
        titleEl.innerText = `調課: ${overrideObj.title}`;
        timeText = `${overrideObj.targetDate} (${overrideObj.startTime}~${overrideObj.endTime})`;
        
        if (overrideObj.type === "school") {
            hasTabs = true;
            courseKey = overrideObj.sourceKey;

            const firstUnderscore = courseKey.indexOf("_");
            const cDay = courseKey.substring(0, firstUnderscore);
            const cPeriod = courseKey.substring(firstUnderscore + 1);
            
            if (String(cPeriod).startsWith("custom_")) {
                course = (sch.customCourses || []).find(c => c.id === cPeriod) || {};
            } else {
                course = (sch.courses && sch.courses[courseKey]) || {};
            }
        }
        switchBtn.onclick = () => { 
            closeModal("view-detail-modal"); 
            openOverrideModal(overrideObj.id); 
        }; 
        revertBtn.style.display = "inline-flex";
    }

    if (hasTabs && course) {
        // ------------------ 基本資訊介面建置 ------------------
        infoHtml = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${timeText}</div>`;
        if (overrideObj && overrideObj.memo) infoHtml += `<div class="detail-label">調課備註</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtmlWithBr(overrideObj.memo)}</div>`;
        if (course.type) infoHtml += `<div class="detail-label">課程屬性</div><div class="detail-value">${escapeHtml(course.type)}</div>`;
        if (course.room) infoHtml += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(course.room)}</div>`;
        if (course.teacher) infoHtml += `<div class="detail-label">教師</div><div class="detail-value">${escapeHtml(course.teacher)}</div>`;
        infoHtml += `</div>`;

        const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`school_${courseKey}`]) || "";
        
        // ------------------ 筆記介面建置 (含編輯輸入框) ------------------
        notesHtml = ``;
        
        // 1. 重要日程與死線 (包含列表與新增區)
        notesHtml += `<div class="detail-card">
            <div class="detail-label" style="color:#ef4444; margin-top:0;">🚨 重要日程 / 考試死線</div>
            <div style="margin-bottom:8px;">`;
            
        if (course.deadlines && course.deadlines.length > 0) {
            let sortedDl = [...course.deadlines].sort((a,b) => parseLocalDate(a.date) - parseLocalDate(b.date));
            sortedDl.forEach(dl => {
                notesHtml += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:0.8rem; background:var(--input-bg); padding:4px 6px; border-radius:4px; border:1px solid var(--border);">
                    <span><b style="color:var(--primary);">${formatSlashDate(dl.date)}</b> - ${escapeHtml(dl.title)}</span>
                    <button class="btn btn-danger" style="padding:2px 6px; font-size:0.6rem;" onclick="deleteCourseDeadline('${courseKey}', '${dl.id}')">刪除</button>
                </div>`;
            });
        } else {
            notesHtml += `<div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">尚無排定日程</div>`;
        }
        
        notesHtml += `
            <div style="display:flex; gap:4px; margin-top:6px;">
                <input type="text" id="detail-new-dl-title" placeholder="如: 期中考" style="flex:2; padding:4px; font-size:0.75rem; border-radius:4px; border:1px solid var(--border); background:var(--input-bg); color:var(--text);">
                <input type="date" id="detail-new-dl-date" style="flex:2; padding:4px; font-size:0.75rem; border-radius:4px; border:1px solid var(--border); background:var(--input-bg); color:var(--text);">
                <button class="btn btn-secondary" onclick="addCourseDeadline('${courseKey}')" style="flex:1; padding:4px; font-size:0.75rem;">新增</button>
            </div>
        </div></div>`;

        // 2. 備忘錄輸入區
        notesHtml += `<div class="detail-card">
            <div class="detail-label" style="margin-top:0;">總備忘錄</div>
            <textarea id="detail-memo-input" rows="2" style="width:100%; padding:6px; font-size:0.8rem; border-radius:4px; border:1px solid var(--border); margin-bottom:6px; background:var(--input-bg); color:var(--text);" placeholder="整個學期的備忘錄...">${escapeHtml(course.memo || "")}</textarea>
            
            <div class="detail-label">每周備忘錄 (當週有效)</div>
            <textarea id="detail-weekly-memo-input" rows="2" style="width:100%; padding:6px; font-size:0.8rem; border-radius:4px; border:1px solid var(--border); margin-bottom:6px; background:var(--input-bg); color:var(--text);" placeholder="本週的特別提醒...">${escapeHtml(weeklyMemo)}</textarea>
            
            <button class="btn" style="width:100%; justify-content:center;" onclick="saveCourseMemos('${courseKey}')">儲存備忘錄</button>
        </div>`;

        // 3. 逐日課程筆記
        let allDatesWithNext = [];
        if (overrideObj) {
            allDatesWithNext = [overrideObj.targetDate];
        } else {
            const cDay = courseKey.split("_")[0];
            allDatesWithNext = getCourseDates(sch, cDay, true);
        }
        
        let optionsHtml = allDatesWithNext.length > 0 
            ? [...allDatesWithNext].reverse().map(d => `<option value="${d}">${formatSlashDate(d)}</option>`).join('')
            : `<option value="">無日期</option>`;
            
        notesHtml += `
        <div style="margin-bottom: 8px; background:var(--table-th-bg); padding:8px; border-radius:6px; border:1px solid var(--border);">
            <div style="font-size:0.8rem; font-weight:bold; color:var(--primary); margin-bottom:4px;">✏️ 課堂紀錄 (按日期)</div>
            <select id="course-note-date" style="width:100%; padding:6px; border-radius:4px; border:1px solid var(--border); margin-bottom:6px; background:var(--input-bg); color:var(--text);">
                ${optionsHtml}
            </select>
            <textarea id="course-note-input" rows="2" style="width:100%; padding:6px; border-radius:4px; border:1px solid var(--border); margin-bottom:6px; background:var(--input-bg); color:var(--text);" placeholder="輸入當日筆記內容..."></textarea>
            <button class="btn" id="btn-save-note" style="width:100%; justify-content:center;" onclick="saveCourseNote('${courseKey}')">新增筆記</button>
        </div>
        <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 4px;">
        `;
        
        let notes = course.notes || [];
        if (notes.length === 0) {
            notesHtml += `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:10px;">尚無課程筆記</div>`;
        } else {
            notes.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(n => {
                notesHtml += `
                <div class="note-item" style="background:var(--card-bg); border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; border-bottom:1px solid var(--border); padding-bottom:4px;">
                        <span style="font-weight:bold; color:var(--primary); font-size:0.75rem;">${formatSlashDate(n.date)}</span>
                        <div>
                            <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.6rem; margin-right:4px;" onclick="editCourseNote('${courseKey}', '${n.id}')">編輯</button>
                            <button class="btn btn-danger" style="padding:2px 6px; font-size:0.6rem;" onclick="deleteCourseNote('${courseKey}', '${n.id}')">刪除</button>
                        </div>
                    </div>
                    <div style="line-height:1.4; word-break:break-all; font-size:0.8rem;">${escapeHtmlWithBr(n.content)}</div>
                </div>
                `;
            });
        }
        notesHtml += `</div>`;

        // ------------------ 出缺席介面建置 ------------------
        let attendance = course.attendance || {};
        let pastDates = [];
        
        if (overrideObj) {
            const today = new Date(); 
            today.setHours(0, 0, 0, 0);
            const targetD = parseLocalDate(overrideObj.targetDate); 
            targetD.setHours(0, 0, 0, 0);
            if (targetD <= today) pastDates = [overrideObj.targetDate];
        } else {
            const cDay = courseKey.split("_")[0];
            pastDates = getCourseDates(sch, cDay, false);
        }

        let stats = { present: 0, late: 0, absent: 0, leave: 0, cancel: 0 };
        Object.values(attendance).forEach(s => { 
            if (stats[s] !== undefined) stats[s]++; 
        });

        attendanceHtml = `
            <div style="display:flex; justify-content:space-around; margin-bottom:8px; font-size:0.75rem; text-align:center; background:var(--table-th-bg); padding:8px; border-radius:6px; border:1px solid var(--border);">
                <div>出席<br><b style="color:var(--primary); font-size:0.9rem;">${stats.present}</b></div>
                <div>遲到<br><b style="color:#f59e0b; font-size:0.9rem;">${stats.late}</b></div>
                <div>曠課<br><b style="color:#ef4444; font-size:0.9rem;">${stats.absent}</b></div>
                <div>請假<br><b style="color:#3b82f6; font-size:0.9rem;">${stats.leave}</b></div>
                <div>停課<br><b style="font-size:0.9rem;">${stats.cancel}</b></div>
            </div>
            <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 4px;">
        `;
        
        let pastDatesReversed = [...pastDates].reverse();
        if (pastDatesReversed.length === 0) {
            attendanceHtml += `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:10px;">尚無已經過的日期</div>`;
        }
        
        pastDatesReversed.forEach(date => {
            let s = attendance[date] || "";
            attendanceHtml += `
            <div class="attendance-row">
                <span style="font-weight:bold; font-size:0.75rem;">${formatSlashDate(date)}</span>
                <div class="attendance-actions" style="display:flex; gap:2px;">
                    <button class="btn ${s==='present'?'active':'btn-secondary'}" onclick="markAttendance('${courseKey}', '${date}', 'present')">出席</button>
                    <button class="btn ${s==='late'?'active':'btn-secondary'}" style="background:${s==='late'?'#f59e0b':''}" onclick="markAttendance('${courseKey}', '${date}', 'late')">遲到</button>
                    <button class="btn ${s==='absent'?'active':'btn-secondary'}" style="background:${s==='absent'?'#ef4444':''}" onclick="markAttendance('${courseKey}', '${date}', 'absent')">曠課</button>
                    <button class="btn ${s==='leave'?'active':'btn-secondary'}" style="background:${s==='leave'?'#3b82f6':''}" onclick="markAttendance('${courseKey}', '${date}', 'leave')">請假</button>
                    <button class="btn ${s==='cancel'?'active':'btn-secondary'}" style="background:${s==='cancel'?'#64748b':''}" onclick="markAttendance('${courseKey}', '${date}', 'cancel')">停課</button>
                </div>
            </div>`;
        });
        attendanceHtml += `</div>`;

        const tabStyles = `
            flex:1; text-align:center; padding:8px 0; font-size:0.85rem; font-weight:700; 
            cursor:pointer; border-bottom:2px solid transparent; color:var(--text-muted); transition:all 0.2s;
        `;
        const activeTabStyle = `border-bottom:2px solid var(--primary); color:var(--primary);`;

        let renderHtml = `
            <div style="display:flex; margin-bottom:12px; border-bottom:1px solid var(--border);">
                <div id="tab-btn-info" style="${tabStyles} ${activeTab === 'info' ? activeTabStyle : ''}" onclick="switchDetailTab('info')">ℹ️ 資訊</div>
                <div id="tab-btn-notes" style="${tabStyles} ${activeTab === 'notes' ? activeTabStyle : ''}" onclick="switchDetailTab('notes')">📝 筆記</div>
                <div id="tab-btn-attendance" style="${tabStyles} ${activeTab === 'attendance' ? activeTabStyle : ''}" onclick="switchDetailTab('attendance')">📊 出缺席</div>
            </div>
            <div id="tab-content-info" style="display:${activeTab === 'info' ? 'block' : 'none'}; animation: fadeIn 0.2s;">${infoHtml}</div>
            <div id="tab-content-notes" style="display:${activeTab === 'notes' ? 'block' : 'none'}; animation: fadeIn 0.2s;">${notesHtml}</div>
            <div id="tab-content-attendance" style="display:${activeTab === 'attendance' ? 'block' : 'none'}; animation: fadeIn 0.2s;">${attendanceHtml}</div>
        `;
        
        bodyEl.innerHTML = renderHtml;
        
    } else {
        if (type === "tutoring") {
            const { tut } = payload; 
            titleEl.innerText = `家教: ${tut.student}`; 
            const weeklyMemo = (sch.weeklyMemos[weekKey] && sch.weeklyMemos[weekKey][`tut_${tut.id}`]) || "";
            
            let html = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[Number(tut.day)]} ${tut.startTime} ~ ${tut.endTime}</div>`;
            if (tut.subject) html += `<div class="detail-label">科目</div><div class="detail-value">${escapeHtml(tut.subject)}</div>`;
            if (tut.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tut.location)}</div>`;
            if (tut.line) html += `<div class="detail-label">Line ID</div><div class="detail-value">${escapeHtml(tut.line)}</div>`;
            if (tut.fb) html += `<div class="detail-label">Facebook</div><div class="detail-value">${escapeHtml(tut.fb)}</div>`;
            if (tut.phone) html += `<div class="detail-label">電話</div><div class="detail-value">${escapeHtml(tut.phone)}</div>`;
            if (tut.rate) html += `<div class="detail-label">收費時薪</div><div class="detail-value">$${escapeHtml(tut.rate)} / hr</div>`;
            if (tut.memo) html += `<div class="detail-label">備忘錄</div><div class="detail-value">${escapeHtmlWithBr(tut.memo)}</div>`;
            if (weeklyMemo) html += `<div class="detail-label">每周備忘錄</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${escapeHtmlWithBr(weeklyMemo)}</div>`;
            html += `</div>`;
            
            bodyEl.innerHTML = html;
            switchBtn.onclick = () => { 
                closeModal("view-detail-modal"); 
                openTutoringModal(tut.id); 
            };
            
        } else if (type === "work") {
            const { work } = payload; 
            titleEl.innerText = `工作: ${work.name}`;
            
            let html = `<div class="detail-card">
                            <div class="detail-label">類型</div><div class="detail-value" style="color:var(--primary); font-weight:700;">${work.type === "weekly" ? "每週工作" : "固定工作"}</div>
                            <div class="detail-label">時間</div><div class="detail-value">${dayNames[Number(work.day)]} ${work.startTime} ~ ${work.endTime}</div>`;
            if (work.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(work.location)}</div>`;
            if (work.rate) html += `<div class="detail-label">工作時薪</div><div class="detail-value">$${escapeHtml(work.rate)} / hr</div>`;
            if (work.memo) html += `<div class="detail-label">備忘</div><div class="detail-value">${escapeHtmlWithBr(work.memo)}</div>`;
            html += `</div>`;
            
            bodyEl.innerHTML = html;
            switchBtn.onclick = () => { 
                closeModal("view-detail-modal"); 
                openWorkModal(work.id); 
            };
            
        } else if (type === "override" && !hasTabs) {
            let html = `<div class="detail-card">`;

            // 判斷調課來源是否為家教，套用與圖片完全相同的排版
            if (overrideObj.type === "tutoring") {
                const tut = (sch.tutorings || []).find(t => t.id === overrideObj.sourceId) || {};
                html += `<div class="detail-label" style="color:var(--primary);">調課後時間</div><div class="detail-value" style="font-weight:700;">${timeText}</div>`;
                html += `<div class="detail-label">原定時間</div><div class="detail-value" style="text-decoration: line-through; opacity: 0.7;">${dayNames[Number(tut.day)]} ${tut.startTime} ~ ${tut.endTime}</div>`;
                if (tut.subject) html += `<div class="detail-label">科目</div><div class="detail-value">${escapeHtml(tut.subject)}</div>`;
                if (tut.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tut.location)}</div>`;
                if (tut.line) html += `<div class="detail-label">Line ID</div><div class="detail-value">${escapeHtml(tut.line)}</div>`;
                if (tut.fb) html += `<div class="detail-label">Facebook</div><div class="detail-value">${escapeHtml(tut.fb)}</div>`;
                if (tut.phone) html += `<div class="detail-label">電話</div><div class="detail-value">${escapeHtml(tut.phone)}</div>`;
                if (tut.rate) html += `<div class="detail-label">收費時薪</div><div class="detail-value">$${escapeHtml(tut.rate)} / hr</div>`;
            
            // 判斷調課來源是否為工作，套用專屬排版
            } else if (overrideObj.type === "work") {
                const work = (sch.works || []).find(w => w.id === overrideObj.sourceId) || {};
                html += `<div class="detail-label" style="color:var(--primary);">調課後時間</div><div class="detail-value" style="font-weight:700;">${timeText}</div>`;
                html += `<div class="detail-label">原定時間</div><div class="detail-value" style="text-decoration: line-through; opacity: 0.7;">${dayNames[Number(work.day)]} ${work.startTime} ~ ${work.endTime}</div>`;
                if (work.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(work.location)}</div>`;
                if (work.rate) html += `<div class="detail-label">工作時薪</div><div class="detail-value">$${escapeHtml(work.rate)} / hr</div>`;
            
            // 其他未知的調課類型
            } else {
                html += `<div class="detail-label">目標時間</div><div class="detail-value">${timeText}</div>`;
            }

            if (overrideObj.memo) html += `<div class="detail-label">調課備註</div><div class="detail-value">${escapeHtmlWithBr(overrideObj.memo)}</div>`;
            html += `</div>`;
            
            bodyEl.innerHTML = html;
            
        } else if (type === "temp_event") {
            const { tmp } = payload; 
            currentViewingTempEventId = tmp.id; 
            titleEl.innerText = `事件: ${tmp.title}`; 
            
            let html = `<div class="detail-card"><div class="detail-label">時間</div><div class="detail-value">${dayNames[Number(tmp.day)]} ${tmp.startTime}~${tmp.endTime}</div>`;
            if (tmp.location) html += `<div class="detail-label">地點</div><div class="detail-value">${escapeHtml(tmp.location)}</div>`;
            if (tmp.memo) html += `<div class="detail-label">備忘</div><div class="detail-value">${escapeHtmlWithBr(tmp.memo)}</div>`;
            html += `</div>`;
            
            bodyEl.innerHTML = html;
            switchBtn.onclick = () => { 
                closeModal("view-detail-modal"); 
                openTempEventModal(tmp.id); 
            };
        }
    }
    document.getElementById("view-detail-modal").classList.add("active");
    if (isViewingFriend) {
        switchBtn.innerText = "💬";
        switchBtn.title = "留便利貼";
        switchBtn.style.fontSize = "1.1rem";
        if (type === "school") {
             switchBtn.onclick = () => { closeModal("view-detail-modal"); openLeaveNoteModal(payload.day, payload.periodId); };
        } else if (type === "tutoring") {
             switchBtn.onclick = () => { closeModal("view-detail-modal"); openLeaveNoteModal(payload.tut.day, payload.tut.id); };
        } else if (type === "work") {
             switchBtn.onclick = () => { closeModal("view-detail-modal"); openLeaveNoteModal(payload.work.day, payload.work.id); };
        } else {
             switchBtn.style.display = "none";
        }
    } else {
        switchBtn.innerText = "⚙️";
        switchBtn.title = "進入編輯";
        switchBtn.style.fontSize = "1.25rem";
    }

    document.getElementById("view-detail-modal").classList.add("active");
    autoExpandTextareasInModal();
}

function revertCurrentOverride() { 
    showConfirm("確定取消此調課？", () => { 
        const sch = getActiveSchedule(); 
        sch.overrides = (sch.overrides || []).filter(o => o.id !== currentViewingOverrideId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("view-detail-modal"); 
        showToast("已復原調課");
    }); 
}

function deleteOverrideFromModal() { 
    showConfirm("確定刪除此調課紀錄？", () => { 
        const sch = getActiveSchedule(); 
        sch.overrides = (sch.overrides || []).filter(o => o.id !== currentEditingOverrideId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("override-modal"); 
        showToast("已刪除調課紀錄");
    }); 
}

function deleteTempEventFromModal() { 
    showConfirm("確定刪除此事件？", () => { 
        const sch = getActiveSchedule(); 
        sch.temporaryEvents = (sch.temporaryEvents || []).filter(t => t.id !== currentEditingTempEventId); 
        saveToStorage(); 
        renderSchedule(); 
        closeModal("temp-event-modal"); 
        showToast("已刪除臨時事件");
    }); 
}

// ========================================================
// 學校課程 Modal
// ========================================================

window.onSchMultiModeChange = function(mode) {
    const pWrap = document.getElementById("sch-multi-period-wrap");
    const tWrap = document.getElementById("sch-multi-time-wrap");
    if (pWrap) pWrap.style.display = mode === "period" ? "block" : "none";
    if (tWrap) tWrap.style.display = mode === "time" ? "flex" : "none";
};

// 動態產生課程屬性選單 (根據學分計算機的設定)
function populateSchTypeSelect() {
    if (typeof window.ensureCreditState === 'function') {
        window.ensureCreditState();
    }
    const select = document.getElementById("sch-type-select");
    if (!select) return;
    
    select.innerHTML = "";
    (state.credits?.domains || []).forEach(d => {
        select.appendChild(new Option(d.name, d.name));
    });
    select.appendChild(new Option("自訂填寫...", "custom"));
}

function openSchoolModal(day, period) {
    isMultiSelectMode = false;
    currentEditingSlot = { day, period }; 
    const sch = getActiveSchedule();
    const key = `${day}_${period}`;
    let course = {};
    
    if (String(period).startsWith("custom_")) {
        course = (sch.customCourses || []).find(c => c.id === period) || {};
        document.getElementById("sch-multi-time-wrap").style.display = "flex";
        document.getElementById("sch-multi-start-time").value = course.startTime || "08:00";
        document.getElementById("sch-multi-end-time").value = course.endTime || "10:00";
    } else {
        course = (sch.courses && sch.courses[key]) || {};
        document.getElementById("sch-multi-time-wrap").style.display = "none";
    }
    
    document.getElementById("sch-multi-select-wrap").style.display = "none";
    document.getElementById("sch-delete-btn").style.display = "inline-flex";

    document.getElementById("sch-name").value = course.name || ""; 
    document.getElementById("sch-room").value = course.room || ""; 
    document.getElementById("sch-teacher").value = course.teacher || ""; 
    document.getElementById("sch-credits").value = course.credits !== undefined ? course.credits : ""; 
    
    const isMaskedEl = document.getElementById("sch-is-masked");
    if (isMaskedEl) isMaskedEl.checked = course.isMasked || false; 
    
    populateSchTypeSelect();
    const typeSelect = document.getElementById("sch-type-select");
    const cType = course.type || (state.credits?.domains[0]?.name || "系必修"); 
    
    if (Array.from(typeSelect.options).some(o => o.value === cType)) { 
        typeSelect.value = cType; 
        document.getElementById("sch-type-custom-wrap").style.display = "none"; 
    } else { 
        typeSelect.value = "custom"; 
        document.getElementById("sch-type-custom-wrap").style.display = "block"; 
        document.getElementById("sch-type-custom").value = cType; 
    }
    
    document.getElementById("sch-color").value = course.color || getDefaultSchoolBgHex(); 
    document.getElementById("school-modal").classList.add("active");
}

function openMultiSchoolModal() {
    isMultiSelectMode = true;
    currentEditingSlot = null;
    
    document.getElementById("sch-multi-select-wrap").style.display = "block";
    document.getElementById("sch-delete-btn").style.display = "none";
    
    const modeSel = document.getElementById("sch-multi-mode");
    if (modeSel) {
        modeSel.value = state.is24HourMode ? "time" : "period";
        if (typeof onSchMultiModeChange === 'function') {
            onSchMultiModeChange(modeSel.value);
        }
    }
    
    document.getElementById("sch-name").value = ""; 
    document.getElementById("sch-room").value = ""; 
    document.getElementById("sch-teacher").value = ""; 
    document.getElementById("sch-credits").value = ""; 
    
    if (document.getElementById("sch-is-masked")) {
        document.getElementById("sch-is-masked").checked = false; 
    }
    
    populateSchTypeSelect();
    document.getElementById("sch-type-select").value = state.credits?.domains[0]?.name || "custom";
    document.getElementById("sch-type-custom-wrap").style.display = "none";
    document.getElementById("sch-color").value = getDefaultSchoolBgHex(); 
    
    const grid = document.getElementById("sch-multi-periods");
    grid.innerHTML = "";
    const periods = getActiveSchedule().periods || initialDefaultPeriods;
    
    periods.forEach(p => {
        if (p.optional && !state.showLatePeriods) return;
        const btn = document.createElement("div");
        btn.className = "period-chk-btn";
        btn.dataset.pid = p.id;
        btn.innerText = p.name;
        btn.onclick = () => btn.classList.toggle("active");
        grid.appendChild(btn);
    });

    document.getElementById("school-modal").classList.add("active");
}

function saveSchoolCourse() {
    triggerHaptic(20); 
    const sch = getActiveSchedule();
    const name = document.getElementById("sch-name").value.trim();
    const color = document.getElementById("sch-color").value; 
    const savedColor = color.toLowerCase() === getDefaultSchoolBgHex().toLowerCase() ? undefined : color;

    if (!sch.customCourses) sch.customCourses = [];

    const oldName = currentEditingSlot 
        ? (String(currentEditingSlot.period).startsWith("custom_") 
            ? (sch.customCourses.find(c => c.id === currentEditingSlot.period)?.name) 
            : (sch.courses[`${currentEditingSlot.day}_${currentEditingSlot.period}`]?.name)) 
        : null;

    if (!name) {
        if (!isMultiSelectMode && currentEditingSlot) {
            const key = `${currentEditingSlot.day}_${currentEditingSlot.period}`;
            
            if (String(currentEditingSlot.period).startsWith("custom_")) {
                 sch.customCourses = sch.customCourses.filter(c => c.id !== currentEditingSlot.period);
            } else {
                 delete sch.courses[key]; 
            }
            
            const wk = getWeekKey(new Date());
            if (sch.weeklyMemos && sch.weeklyMemos[wk]) {
                delete sch.weeklyMemos[wk][`school_${key}`];
            }
            
            saveToStorage(); 
            renderSchedule(); 
            closeModal("school-modal"); 
            showToast("已清空該課程");
            return; 
        } else {
            showToast("請輸入課程名稱！", "error"); 
            return;
        }
    }
    
    let typeVal = document.getElementById("sch-type-select").value; 
    if (typeVal === "custom") {
        typeVal = document.getElementById("sch-type-custom").value.trim() || (state.credits?.domains[0]?.name || "系必修");
    }
    
    let creditsVal = document.getElementById("sch-credits").value;
    creditsVal = creditsVal === "" ? "" : Number(creditsVal);
    
    const isMaskedEl = document.getElementById("sch-is-masked");
    const isMasked = isMaskedEl ? isMaskedEl.checked : false; 

    let finalRoom = document.getElementById("sch-room").value.trim();
    let finalTeacher = document.getElementById("sch-teacher").value.trim();

    if (!sch.courses) sch.courses = {}; 

    if (isMultiSelectMode) {
        const day = document.getElementById("sch-multi-day").value;
        const mode = document.getElementById("sch-multi-mode").value;
        
        if (mode === "period") {
            const activeBtns = document.querySelectorAll("#sch-multi-periods .period-chk-btn.active");
            if (activeBtns.length === 0) { 
                showToast("請至少選擇一個節次！", "error"); 
                return; 
            }
            
            activeBtns.forEach(btn => {
                const key = `${day}_${btn.dataset.pid}`;
                const oldObj = sch.courses[key] || {};
                sch.courses[key] = { 
                    name, 
                    type: typeVal, 
                    credits: creditsVal, 
                    room: finalRoom, 
                    teacher: finalTeacher, 
                    isMasked, 
                    color: savedColor, 
                    memo: oldObj.memo || "", 
                    deadlines: oldObj.deadlines || [],
                    attendance: oldObj.attendance || {}, 
                    notes: oldObj.notes || []
                };
            });
        } else {
            const st = document.getElementById("sch-multi-start-time").value;
            const et = document.getElementById("sch-multi-end-time").value;
            
            if (!st || !et) { 
                showToast("請輸入完整時間！", "error"); 
                return; 
            }
            
            const customId = "custom_" + Date.now();
            sch.customCourses.push({
                id: customId, 
                day: day, 
                startTime: st, 
                endTime: et, 
                name: name, 
                type: typeVal, 
                credits: creditsVal,
                room: finalRoom, 
                teacher: finalTeacher, 
                isMasked: isMasked, 
                color: savedColor,
                memo: "", 
                deadlines: []
            });
        }
    } else if (currentEditingSlot) {
        if (String(currentEditingSlot.period).startsWith("custom_")) {
            const targetId = currentEditingSlot.period;
            const targetCourse = sch.customCourses.find(c => c.id === targetId);
            
            if (targetCourse) {
                targetCourse.name = name; 
                targetCourse.type = typeVal; 
                targetCourse.credits = creditsVal;
                targetCourse.room = finalRoom; 
                targetCourse.teacher = finalTeacher;
                targetCourse.isMasked = isMasked; 
                targetCourse.color = savedColor;
                
                const stInput = document.getElementById("sch-multi-start-time").value; 
                const etInput = document.getElementById("sch-multi-end-time").value;
                if (!stInput || !etInput) { 
                    showToast("自訂課程必須包含完整的起訖時間！", "error"); 
                    return; 
                }
                
                targetCourse.startTime = stInput; 
                targetCourse.endTime = etInput;
            }
        } else {
            const key = `${currentEditingSlot.day}_${currentEditingSlot.period}`;
            const oldObj = sch.courses[key] || {};
            sch.courses[key] = { 
                name, 
                type: typeVal, 
                credits: creditsVal, 
                room: finalRoom, 
                teacher: finalTeacher, 
                isMasked, 
                color: savedColor, 
                memo: oldObj.memo || "", 
                deadlines: oldObj.deadlines || [],
                attendance: oldObj.attendance || {}, 
                notes: oldObj.notes || []
            };
        }
    }
    
    // 同名課程連動 
    if (!isMultiSelectMode && name && state.syncCourseName !== false) {
        const targetNames = [name];
        if (oldName) targetNames.push(oldName);

        Object.keys(sch.courses).forEach(k => { 
            if (targetNames.includes(sch.courses[k].name)) { 
                sch.courses[k].name = name; 
                sch.courses[k].room = finalRoom; 
                sch.courses[k].teacher = finalTeacher;
                sch.courses[k].color = savedColor; 
                sch.courses[k].type = typeVal; 
                sch.courses[k].credits = creditsVal; 
                sch.courses[k].isMasked = isMasked;
            } 
        });
        
        if (sch.customCourses) {
            sch.customCourses.forEach(c => {
                if (targetNames.includes(c.name)) {
                    c.name = name; 
                    c.room = finalRoom; 
                    c.teacher = finalTeacher; 
                    c.color = savedColor; 
                    c.type = typeVal; 
                    c.credits = creditsVal; 
                    c.isMasked = isMasked;
                }
            });
        }
    }
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal("school-modal"); 
    showToast("課程儲存成功");
}

function deleteSchoolCourse() { 
    if (!currentEditingSlot) return; 
    
    showConfirm("刪除該課程？", () => {
        triggerHaptic(25); 
        const sch = getActiveSchedule();
        const key = `${currentEditingSlot.day}_${currentEditingSlot.period}`;
        
        if (String(currentEditingSlot.period).startsWith("custom_")) {
             sch.customCourses = sch.customCourses.filter(c => c.id !== currentEditingSlot.period);
        } else {
             delete sch.courses[key]; 
        }
        
        const wk = getWeekKey(new Date());
        if (sch.weeklyMemos && sch.weeklyMemos[wk]) {
            delete sch.weeklyMemos[wk][`school_${key}`];
        }
        
        saveToStorage(); 
        renderSchedule(); 
        closeModal("school-modal"); 
        showToast("已刪除該課程");
    });
}

// ========================================================
// 家教與工作 Modal
// ========================================================

function openTutoringModal(id = null) {
    currentEditingTutoringId = id; 
    const sch = getActiveSchedule(); 
    const defHex = getDefaultTutoringBgHex();
    
    if (id) {
        const tut = (sch.tutorings || []).find((t) => t.id === id); 
        if (!tut) return;
        
        ["student", "day", "start-time", "end-time", "subject", "location", "line", "fb", "phone", "rate", "memo"].forEach(k => { 
            const val = tut[k.replace(/-([a-z])/g, g => g[1].toUpperCase())];
            document.getElementById(`tut-${k}`).value = val || ""; 
        });
        
        const isMaskedEl = document.getElementById("tut-is-masked"); 
        if (isMaskedEl) isMaskedEl.checked = tut.isMasked || false;
        
        document.getElementById("tut-color").value = tut.color || defHex; 
        document.getElementById("tut-weekly-memo").value = (sch.weeklyMemos[getWeekKey(new Date())] && sch.weeklyMemos[getWeekKey(new Date())][`tut_${id}`]) || ""; 
        document.getElementById("tut-delete-btn").style.display = "inline-flex";
    } else {
        ["student", "subject", "location", "line", "fb", "phone", "rate", "memo", "weekly-memo"].forEach(k => document.getElementById(`tut-${k}`).value = ""); 
        
        if (document.getElementById("tut-is-masked")) {
            document.getElementById("tut-is-masked").checked = false;
        }
        
        document.getElementById("tut-day").value = "6"; 
        document.getElementById("tut-start-time").value = "18:00"; 
        document.getElementById("tut-end-time").value = "20:00"; 
        document.getElementById("tut-color").value = defHex; 
        document.getElementById("tut-delete-btn").style.display = "none";
    }
    document.getElementById("tutoring-modal").classList.add("active");
}

function saveTutoringClass() {
    const student = document.getElementById("tut-student").value.trim(); 
    if (!student) { 
        showToast("請填寫學生姓名！", "error"); 
        return; 
    }
    
    const sch = getActiveSchedule(); 
    const color = document.getElementById("tut-color").value;
    const savedColor = color.toLowerCase() === getDefaultTutoringBgHex().toLowerCase() ? undefined : color;
    
    const isMaskedEl = document.getElementById("tut-is-masked"); 
    const isMasked = isMaskedEl ? isMaskedEl.checked : false;
    
    const itemData = { 
        id: currentEditingTutoringId || "tut_" + Date.now(), 
        student, 
        day: document.getElementById("tut-day").value, 
        startTime: document.getElementById("tut-start-time").value, 
        endTime: document.getElementById("tut-end-time").value, 
        subject: document.getElementById("tut-subject").value.trim(), 
        location: document.getElementById("tut-location").value.trim(), 
        line: document.getElementById("tut-line").value.trim(), 
        fb: document.getElementById("tut-fb").value.trim(), 
        phone: document.getElementById("tut-phone").value.trim(), 
        rate: document.getElementById("tut-rate").value, 
        memo: document.getElementById("tut-memo").value.trim(), 
        isMasked, 
        color: savedColor 
    };
    
    if (currentEditingTutoringId) { 
        const idx = sch.tutorings.findIndex((t) => t.id === currentEditingTutoringId); 
        if (idx > -1) sch.tutorings[idx] = itemData; 
    } else { 
        sch.tutorings.push(itemData); 
    }
    
    const wk = getWeekKey(new Date()); 
    const memo = document.getElementById("tut-weekly-memo").value.trim(); 
    
    if (!sch.weeklyMemos) sch.weeklyMemos = {}; 
    if (!sch.weeklyMemos[wk]) sch.weeklyMemos[wk] = {}; 
    
    if (memo) {
        sch.weeklyMemos[wk][`tut_${itemData.id}`] = memo; 
    } else {
        delete sch.weeklyMemos[wk][`tut_${itemData.id}`];
    }
    
    saveToStorage(); 
    renderSchedule(); 
    renderBillings(); 
    closeModal("tutoring-modal"); 
    showToast("家教設定已儲存");
}

function deleteTutoringClass() { 
    showConfirm("刪除此家教？", () => { 
        const sch = getActiveSchedule();
        sch.tutorings = sch.tutorings.filter(t => t.id !== currentEditingTutoringId); 
        
        // 【修復 4】深度清理遺留的備忘錄 (Weekly Memos)
        if (sch.weeklyMemos) {
            Object.keys(sch.weeklyMemos).forEach(weekKey => {
                if (sch.weeklyMemos[weekKey][`tut_${currentEditingTutoringId}`]) {
                    delete sch.weeklyMemos[weekKey][`tut_${currentEditingTutoringId}`];
                }
            });
        }
        
        saveToStorage(); 
        renderSchedule(); 
        closeModal("tutoring-modal"); 
        showToast("已刪除家教紀錄"); 
    }); 
}

function openWorkModal(id = null) {
    currentEditingWorkId = id; 
    const sch = getActiveSchedule(); 
    const defHex = getDefaultWorkBgHex();
    
    if (id) {
        const work = (sch.works || []).find((w) => w.id === id); 
        if (!work) return;
        
        ["type", "name", "day", "start-time", "end-time", "location", "rate", "memo"].forEach(k => { 
            const val = work[k.replace(/-([a-z])/g, g => g[1].toUpperCase())]; 
            document.getElementById(`work-${k}`).value = val || ""; 
        });
        
        const isMaskedEl = document.getElementById("work-is-masked"); 
        if (isMaskedEl) isMaskedEl.checked = work.isMasked || false;
        
        document.getElementById("work-color").value = work.color || defHex; 
        document.getElementById("work-delete-btn").style.display = "inline-flex";
    } else {
        ["name", "location", "rate", "memo"].forEach(k => document.getElementById(`work-${k}`).value = ""); 
        
        if (document.getElementById("work-is-masked")) {
            document.getElementById("work-is-masked").checked = false;
        }
        
        document.getElementById("work-type").value = "fixed"; 
        document.getElementById("work-day").value = "1"; 
        document.getElementById("work-start-time").value = "09:00"; 
        document.getElementById("work-end-time").value = "12:00"; 
        document.getElementById("work-color").value = defHex; 
        document.getElementById("work-delete-btn").style.display = "none";
    }
    document.getElementById("work-modal").classList.add("active");
}

function saveWorkClass() {
    const name = document.getElementById("work-name").value.trim(); 
    if (!name) { 
        showToast("請填寫工作名稱！", "error"); 
        return; 
    }
    
    const sch = getActiveSchedule(); 
    const color = document.getElementById("work-color").value;
    const savedColor = color.toLowerCase() === getDefaultWorkBgHex().toLowerCase() ? undefined : color;
    
    const isMaskedEl = document.getElementById("work-is-masked"); 
    const isMasked = isMaskedEl ? isMaskedEl.checked : false;
    
    const itemData = { 
        id: currentEditingWorkId || "work_" + Date.now(), 
        type: document.getElementById("work-type").value, 
        weekKey: document.getElementById("work-type").value === "weekly" ? getWeekKey(new Date()) : undefined, 
        name, 
        day: document.getElementById("work-day").value, 
        startTime: document.getElementById("work-start-time").value, 
        endTime: document.getElementById("work-end-time").value, 
        location: document.getElementById("work-location").value.trim(), 
        rate: document.getElementById("work-rate").value, 
        memo: document.getElementById("work-memo").value.trim(), 
        isMasked, 
        color: savedColor 
    };
    
    if (currentEditingWorkId) { 
        const idx = sch.works.findIndex((w) => w.id === currentEditingWorkId); 
        if (idx > -1) sch.works[idx] = itemData; 
    } else { 
        sch.works.push(itemData); 
    }
    
    saveToStorage(); 
    renderSchedule(); 
    renderBillings(); 
    closeModal("work-modal"); 
    showToast("工作排程已儲存");
}

function deleteWorkClass() { 
    showConfirm("刪除此工作排程？", () => { 
        const sch = getActiveSchedule();
        sch.works = sch.works.filter((w) => w.id !== currentEditingWorkId); 
        
        // 【修復 4】深度清理遺留的備忘錄 (Weekly Memos)
        if (sch.weeklyMemos) {
            Object.keys(sch.weeklyMemos).forEach(weekKey => {
                if (sch.weeklyMemos[weekKey][`work_${currentEditingWorkId}`]) {
                    delete sch.weeklyMemos[weekKey][`work_${currentEditingWorkId}`];
                }
            });
        }
        
        saveToStorage(); 
        renderSchedule(); 
        closeModal("work-modal"); 
        showToast("已刪除工作排程"); 
    }); 
}
// ========================================================
// 臨時事件與調課 Modal
// ========================================================

function openTempEventModal(tmpId = null) {
    currentEditingTempEventId = tmpId; 
    const sch = getActiveSchedule();
    const periodSelect = document.getElementById("tmp-period-id");
    periodSelect.innerHTML = "";
    
    (sch.periods || initialDefaultPeriods).forEach(p => {
        if (!p.optional || state.showLatePeriods) {
            periodSelect.appendChild(new Option(p.name, p.id));
        }
    });
    
    if (tmpId) {
        const tmp = (sch.temporaryEvents || []).find((t) => t.id === tmpId);
        ["title", "day", "slot-type", "start-time", "end-time", "location", "memo"].forEach(k => { 
            const val = tmp[k.replace(/-([a-z])/g, g => g[1].toUpperCase())]; 
            document.getElementById(`tmp-${k}`).value = val || ""; 
        });
        
        onTempSlotTypeChange(tmp.slotType || "period", true); 
        
        if (tmp.slotType === "period") {
            document.getElementById("tmp-period-id").value = tmp.periodId || "1"; 
        }
        document.getElementById("tmp-delete-btn").style.display = "inline-flex";
    } else {
        ["title", "location", "memo"].forEach(k => document.getElementById(`tmp-${k}`).value = "");
        document.getElementById("tmp-day").value = "1"; 
        document.getElementById("tmp-slot-type").value = "period"; 
        document.getElementById("tmp-period-id").value = "1"; 
        document.getElementById("tmp-start-time").value = "12:00"; 
        document.getElementById("tmp-end-time").value = "13:00"; 
        
        onTempSlotTypeChange("period", true); 
        document.getElementById("tmp-delete-btn").style.display = "none";
    }
    document.getElementById("temp-event-modal").classList.add("active");
}

function onTempSlotTypeChange(type, isInit = false) { 
    document.getElementById("tmp-period-wrap").style.display = type === "period" ? "block" : "none"; 
    document.getElementById("tmp-time-wrap").style.display = type !== "period" ? "flex" : "none"; 
    
    const startTimeInput = document.getElementById("tmp-start-time"); 
    const endTimeInput = document.getElementById("tmp-end-time");
    
    if (type === "noon") { 
        if (!isInit) { 
            startTimeInput.value = "12:00"; 
            endTimeInput.value = "13:00"; 
        } 
        startTimeInput.disabled = true; 
        endTimeInput.disabled = true; 
    } else { 
        startTimeInput.disabled = false; 
        endTimeInput.disabled = false; 
        if (type === "evening" && !isInit) { 
            startTimeInput.value = "18:00"; 
            endTimeInput.value = "20:00"; 
        } 
    }
}

function saveTempEvent() { 
    const title = document.getElementById("tmp-title").value.trim(); 
    const slotType = document.getElementById("tmp-slot-type").value; 
    
    if (!title) { 
        showToast("請輸入事件名稱！", "error"); 
        return; 
    }
    
    const sch = getActiveSchedule(); 
    let startTime = document.getElementById("tmp-start-time").value; 
    let endTime = document.getElementById("tmp-end-time").value; 
    
    if (slotType === "period") { 
        const pObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === document.getElementById("tmp-period-id").value); 
        if (pObj) { 
            startTime = pObj.start; 
            endTime = pObj.end; 
        } 
    } else if (slotType === "noon") { 
        startTime = "12:00"; 
        endTime = "13:00"; 
    }
    
    const item = { 
        id: currentEditingTempEventId || "tmp_" + Date.now(), 
        weekKey: getWeekKey(new Date()), 
        day: document.getElementById("tmp-day").value, 
        slotType, 
        periodId: slotType === "period" ? document.getElementById("tmp-period-id").value : null, 
        title, 
        startTime, 
        endTime, 
        location: document.getElementById("tmp-location").value.trim(), 
        memo: document.getElementById("tmp-memo").value.trim() 
    }; 
    
    if (currentEditingTempEventId) { 
        const idx = sch.temporaryEvents.findIndex(t => t.id === currentEditingTempEventId); 
        if (idx > -1) sch.temporaryEvents[idx] = item; 
    } else { 
        sch.temporaryEvents.push(item); 
    } 
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal("temp-event-modal"); 
    showToast("臨時事件已儲存");
}

function openOverrideModal(id = null) {
    currentEditingOverrideId = id; 
    const sch = getActiveSchedule(); 
    const selectEl = document.getElementById("ovr-source-select"); 
    selectEl.innerHTML = '<option value="">-- 選擇 --</option>'; 
    
    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
    
    if (sch.courses) { 
        Object.keys(sch.courses).forEach(key => { 
            const c = sch.courses[key]; 
            const [day, pId] = key.split("_"); 
            const p = (sch.periods || initialDefaultPeriods).find(x => String(x.id) === pId); 
            if (c && c.name && p) {
                selectEl.appendChild(new Option(`[課程] ${dayNames[day]} ${p.name} - ${c.name}`, `school_${key}`)); 
            }
        }); 
    }
    
    (sch.customCourses || []).forEach(c => { 
        if (c.name) selectEl.appendChild(new Option(`[課程] ${dayNames[c.day]} (自訂) - ${c.name}`, `school_${c.day}_${c.id}`)); 
    });
    
    (sch.tutorings || []).forEach(t => {
        selectEl.appendChild(new Option(`[家教] ${dayNames[t.day]} ${t.student}`, `tutoring_${t.id}`));
    }); 
    
    (sch.works || []).forEach(w => {
        selectEl.appendChild(new Option(`[工作] ${dayNames[w.day]} ${w.name}`, `work_${w.id}`));
    });
    
    if (id) { 
        const ovr = (sch.overrides || []).find(o => o.id === id); 
        if (ovr) { 
            const optionValue = `${ovr.type}_${ovr.sourceKey || ovr.sourceId}`; 
            if (!Array.from(selectEl.options).some(opt => opt.value === optionValue)) { 
                selectEl.appendChild(new Option(`[已刪除或失效項目] ${ovr.title}`, optionValue)); 
            } 
            selectEl.value = optionValue; 
            document.getElementById("ovr-target-date").value = ovr.targetDate; 
            document.getElementById("ovr-start-time").value = ovr.startTime; 
            document.getElementById("ovr-end-time").value = ovr.endTime; 
            document.getElementById("ovr-memo").value = ovr.memo || ""; 
            document.getElementById("ovr-delete-btn").style.display = "inline-flex"; 
        } 
    } else { 
        const viewingDate = new Date();
        viewingDate.setDate(viewingDate.getDate() + currentWeekOffset * 7);
        document.getElementById("ovr-target-date").value = formatDate(viewingDate); 
        document.getElementById("ovr-start-time").value = "18:00"; 
        document.getElementById("ovr-end-time").value = "20:00"; 
        document.getElementById("ovr-memo").value = ""; 
        document.getElementById("ovr-delete-btn").style.display = "none"; 
    }
    
    populateOverrideOriginal(); 
    document.getElementById("override-modal").classList.add("active");
}

function populateOverrideOriginal() { 
    const val = document.getElementById("ovr-source-select").value; 
    const descEl = document.getElementById("ovr-source-desc"); 
    
    if (!val) { 
        descEl.value = ""; 
        return; 
    } 
    
    descEl.value = document.getElementById("ovr-source-select").options[document.getElementById("ovr-source-select").selectedIndex].text; 
}

function saveClassOverride() {
    const val = document.getElementById("ovr-source-select").value; 
    const targetDate = document.getElementById("ovr-target-date").value; 
    const startTime = document.getElementById("ovr-start-time").value; 
    const endTime = document.getElementById("ovr-end-time").value; 
    
    if (!val || !targetDate || !startTime || !endTime) { 
        showToast("請完整填寫！", "error"); 
        return; 
    }
    
    const [type, ...keyParts] = val.split("_"); 
    const sourceIdOrKey = keyParts.join("_"); 
    const sch = getActiveSchedule(); 
    const title = document.getElementById("ovr-source-select").options[document.getElementById("ovr-source-select").selectedIndex].text.split("] ")[1];
    
    // 【修復 1】計算原課程的日期 (sourceDate)
    const monday = getMondayOfWeek(new Date(), currentWeekOffset);
    let sourceDay = 1;
    if (type === "school") {
        sourceDay = Number(sourceIdOrKey.split('_')[0]);
    } else if (type === "tutoring") {
        const t = (sch.tutorings || []).find(x => x.id === sourceIdOrKey);
        if (t) sourceDay = Number(t.day);
    } else if (type === "work") {
        const w = (sch.works || []).find(x => x.id === sourceIdOrKey);
        if (w) sourceDay = Number(w.day);
    }
    const sourceDateObj = new Date(monday);
    sourceDateObj.setDate(monday.getDate() + (sourceDay - 1));
    const sourceDate = formatDate(sourceDateObj);

    const obj = { 
        id: currentEditingOverrideId || "ovr_" + Date.now(), 
        type, 
        sourceKey: type === "school" ? sourceIdOrKey : undefined, 
        sourceId: type !== "school" ? sourceIdOrKey : undefined, 
        sourceDate: sourceDate, // 新增記錄原定日期
        title, 
        targetDate, 
        startTime, 
        endTime, 
        memo: document.getElementById("ovr-memo").value.trim() 
    };
    
    if (currentEditingOverrideId) { 
        const idx = sch.overrides.findIndex(o => o.id === currentEditingOverrideId); 
        if (idx > -1) sch.overrides[idx] = obj; 
    } else { 
        sch.overrides.push(obj); 
    } 
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal("override-modal"); 
    showToast("調課設定已儲存");
}

// ========================================================
// 預設與工具函數
// ========================================================

function updatePresetDropdowns() {
    const cSel = document.getElementById("sch-preset-select"); 
    if (cSel) { 
        cSel.innerHTML = '<option value="">-- 選擇 --</option>'; 
        const uC = {}; 
        
        (state.schedules || []).forEach(s => {
            Object.values(s.courses || {}).forEach((c) => { 
                if (c.name && !uC[c.name]) { 
                    uC[c.name] = c; 
                    cSel.appendChild(new Option(c.name, JSON.stringify(c))); 
                } 
            }); 
            (s.customCourses || []).forEach((c) => { 
                if (c.name && !uC[c.name]) { 
                    uC[c.name] = c; 
                    cSel.appendChild(new Option(c.name, JSON.stringify(c))); 
                } 
            }); 
        });
    }
    
    const tSel = document.getElementById("tut-preset-select"); 
    if (tSel) { 
        tSel.innerHTML = '<option value="">-- 選擇 --</option>'; 
        const uT = {}; 
        
        (state.schedules || []).forEach(s => {
            (s.tutorings || []).forEach((t) => { 
                if (t.student && !uT[t.student]) { 
                    uT[t.student] = t; 
                    tSel.appendChild(new Option(t.student, JSON.stringify(t))); 
                } 
            }); 
        });
    }
    
    const wSel = document.getElementById("work-preset-select"); 
    if (wSel) { 
        wSel.innerHTML = '<option value="">-- 選擇 --</option>'; 
        const uW = {}; 
        
        (state.schedules || []).forEach(s => { 
            (s.works || []).forEach(w => { 
                if (w.name && !uW[w.name]) { 
                    uW[w.name] = w; 
                    wSel.appendChild(new Option(w.name, JSON.stringify(w))); 
                } 
            }); 
        }); 
    }
}

function onSelectPresetCourse(jsonStr) { 
    if (!jsonStr) return; 
    try { 
        const c = JSON.parse(jsonStr); 
        document.getElementById("sch-name").value = c.name || ""; 
        document.getElementById("sch-room").value = c.room || ""; 
        document.getElementById("sch-teacher").value = c.teacher || ""; 
        
        // 帶入學分
        if (document.getElementById("sch-credits")) {
            document.getElementById("sch-credits").value = c.credits !== undefined ? c.credits : ""; 
        }

        const typeSelect = document.getElementById("sch-type-select");
        if (typeSelect) {
            const cType = c.type || (state.credits?.domains[0]?.name || "系必修"); 
            if (Array.from(typeSelect.options).some(o => o.value === cType)) { 
                typeSelect.value = cType; 
                document.getElementById("sch-type-custom-wrap").style.display = "none"; 
            } else { 
                typeSelect.value = "custom"; 
                document.getElementById("sch-type-custom-wrap").style.display = "block"; 
                document.getElementById("sch-type-custom").value = cType; 
            }
        }

        const mEl = document.getElementById("sch-is-masked"); 
        if (mEl) mEl.checked = c.isMasked || false; 
        
        document.getElementById("sch-color").value = c.color || getDefaultSchoolBgHex(); 
        tempDeadlines = c.deadlines ? structuredClone(c.deadlines) : []; 
        
        if (typeof renderModalDeadlines === 'function') {
            renderModalDeadlines();
        }
    } catch (e) { 
        console.error(e); 
    } 
}

function onSchTypeChange(val) { 
    document.getElementById("sch-type-custom-wrap").style.display = val === "custom" ? "block" : "none"; 
}

function onSelectPresetTutoring(jsonStr) { 
    if (!jsonStr) return; 
    try { 
        const t = JSON.parse(jsonStr); 
        document.getElementById("tut-student").value = t.student || ""; 
        if (t.day) document.getElementById("tut-day").value = t.day; 
        if (t.startTime) document.getElementById("tut-start-time").value = t.startTime; 
        if (t.endTime) document.getElementById("tut-end-time").value = t.endTime; 
        
        document.getElementById("tut-subject").value = t.subject || ""; 
        document.getElementById("tut-location").value = t.location || ""; 
        document.getElementById("tut-line").value = t.line || ""; 
        document.getElementById("tut-fb").value = t.fb || ""; 
        document.getElementById("tut-phone").value = t.phone || ""; 
        
        if (t.rate) document.getElementById("tut-rate").value = t.rate; 
        document.getElementById("tut-memo").value = t.memo || ""; 
        
        const mEl = document.getElementById("tut-is-masked"); 
        if (mEl) mEl.checked = t.isMasked || false; 
        
        document.getElementById("tut-color").value = t.color || getDefaultTutoringBgHex(); 
    } catch (e) { 
        console.error(e); 
    } 
}

function onSelectPresetWork(jsonStr) { 
    if (!jsonStr) return; 
    try { 
        const w = JSON.parse(jsonStr); 
        document.getElementById("work-name").value = w.name || ""; 
        if (w.day) document.getElementById("work-day").value = w.day; 
        if (w.startTime) document.getElementById("work-start-time").value = w.startTime; 
        if (w.endTime) document.getElementById("work-end-time").value = w.endTime; 
        
        document.getElementById("work-location").value = w.location || ""; 
        if (w.rate) document.getElementById("work-rate").value = w.rate; 
        document.getElementById("work-memo").value = w.memo || ""; 
        
        const mEl = document.getElementById("work-is-masked"); 
        if (mEl) mEl.checked = w.isMasked || false; 
        
        document.getElementById("work-color").value = w.color || getDefaultWorkBgHex(); 
    } catch (e) { 
        console.error(e); 
    } 
}

function clearAllCustomColors() { 
    showConfirm("確定清除所有自訂顏色？", () => { 
        triggerHaptic(25); 
        const sch = state.schedules.find(s => s.id === state.activeScheduleId); 
        
        if (sch.courses) {
            Object.keys(sch.courses).forEach((k) => delete sch.courses[k].color); 
        }
        if (sch.customCourses) {
            sch.customCourses.forEach((c) => delete c.color);
        }
        if (sch.tutorings) {
            sch.tutorings.forEach((t) => delete t.color); 
        }
        if (sch.works) {
            sch.works.forEach((w) => delete w.color); 
        }
        
        saveToStorage(); 
        renderSchedule(); 
        showToast("已清除所有自訂顏色"); 
    }); 
}

function resetSchoolColor() { 
    document.getElementById("sch-color").value = getDefaultSchoolBgHex(); 
}

function resetTutoringColor() { 
    document.getElementById("tut-color").value = getDefaultTutoringBgHex(); 
}

function resetWorkColor() { 
    document.getElementById("work-color").value = getDefaultWorkBgHex(); 
}
// ========================================================
// 帳務系統 (Billing)
// ========================================================

function switchBillingType(type) { 
    currentBillingType = type; 
    currentSelectedStudentFilter = "__FILTER_ALL__"; 
    
    document.getElementById("btn-billing-type-tutoring").className = `billing-type-btn ${type === "tutoring" ? "active" : ""}`; 
    document.getElementById("btn-billing-type-work").className = `billing-type-btn ${type === "work" ? "active" : ""}`; 
    document.getElementById("nav-billing-text").innerText = type === "tutoring" ? "家教帳務" : "工作帳務"; 
    
    renderBillings(); 
}

function openCurrentBillingModal() { 
    if (currentBillingType === "work") {
        openWorkBillingModal();
    } else {
        openBillingModal();
    }
}

function setBillingMonthCurrent() { 
    const now = new Date(); 
    document.getElementById("bill-month-filter").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; 
    renderBillings(); 
}

function setBillingMonthAll() { 
    document.getElementById("bill-month-filter").value = ""; 
    renderBillings(); 
}

function setStudentFilter(name) { 
    triggerHaptic(15); 
    currentSelectedStudentFilter = name; 
    renderBillings(); 
}

function renderBillings() {
    const tbody = document.getElementById("billing-body"); 
    const isWork = currentBillingType === "work";
    const selectedMonth = document.getElementById("bill-month-filter").value;
    const sortOrder = document.getElementById("bill-sort-order").value;
    
    const btnBillCur = document.getElementById("btn-bill-month-current");
    const btnBillAll = document.getElementById("btn-bill-month-all");
    
    if (btnBillCur && btnBillAll) {
        btnBillCur.className = selectedMonth ? "btn" : "btn btn-secondary";
        btnBillAll.className = !selectedMonth ? "btn" : "btn btn-secondary";
    }

    document.getElementById("th-billing-target").innerText = isWork ? "工作名稱" : "學生";
    document.getElementById("stat-unpaid-title").innerText = isWork ? "未領取金額" : "未繳清金額";
    
    // 收集所有的學生或工作名稱
    const allNamesSet = new Set(); 
    (state.schedules || []).forEach(sch => { 
        (isWork ? sch.works : sch.tutorings).forEach(x => { 
            if (x.name || x.student) allNamesSet.add(x.name || x.student); 
        }); 
    }); 
    (isWork ? state.workBillings : state.billings).forEach(b => { 
        if (b.name || b.student) allNamesSet.add(b.name || b.student); 
    });
    
    // 渲染過濾標籤 (Chips)
    const chips = document.getElementById("student-filter-chips"); 
    let chipsHtml = `<div class="student-chip ${currentSelectedStudentFilter === "__FILTER_ALL__" ? "active" : ""}" onclick="setStudentFilter('__FILTER_ALL__')">${isWork ? "全部工作" : "全部學生"}</div>`; 
    
    Array.from(allNamesSet).forEach(item => { 
        chipsHtml += `<div class="student-chip ${currentSelectedStudentFilter === item ? "active" : ""}" onclick="setStudentFilter('${escapeJS(item)}')">${escapeHtml(item)}</div>`; 
    }); 
    chips.innerHTML = chipsHtml;
    
    // 計算統計數據
    let tI = 0, tU = 0; 
    const statMap = {};
    
    (isWork ? state.workBillings : state.billings).forEach(r => { 
        if (selectedMonth && (r.date || '').slice(0, 7) !== selectedMonth) return; 
        
        const targetName = (isWork ? r.name : r.student) || "未具名";
        const tot = Number(r.total || 0); 
        
        if (!statMap[targetName]) {
            statMap[targetName] = { i: 0, u: 0, p: 0 }; 
        }
        
        statMap[targetName].i += tot; 
        
        if (r.status === "unpaid") {
            statMap[targetName].u += tot; 
        } else {
            statMap[targetName].p += tot; 
        }
        
        if (currentSelectedStudentFilter === "__FILTER_ALL__" || currentSelectedStudentFilter === targetName) { 
            tI += tot; 
            if (r.status === "unpaid") tU += tot; 
        } 
    });
    
    // 渲染各學生/工作的獨立統計卡片
    const statsC = document.getElementById("student-stats-container"); 
    let statsHtml = ""; 
    
    Object.keys(statMap).forEach(k => { 
        statsHtml += `
            <div class="student-stat-card">
                <div class="student-stat-name">${escapeHtml(k)}</div>
                <div class="student-stat-row">
                    <span>應收：</span><strong>$${statMap[k].i.toLocaleString()}</strong>
                </div>
                <div class="student-stat-row">
                    <span>已收：</span><span style="color:#15803d; font-weight:700;">$${statMap[k].p.toLocaleString()}</span>
                </div>
                <div class="student-stat-row">
                    <span>未繳：</span><span style="color:#ef4444; font-weight:700;">$${statMap[k].u.toLocaleString()}</span>
                </div>
            </div>`; 
    }); 
    statsC.innerHTML = statsHtml;
    
    // 過濾與排序列表項目
    const targetArray = isWork ? state.workBillings : state.billings;
    const filtered = targetArray.map((record, idx) => ({ record, idx }))
        .filter(({ record }) => {
            const matchMonth = (!selectedMonth || (record.date || '').slice(0, 7) === selectedMonth);
            const matchTarget = (currentSelectedStudentFilter === "__FILTER_ALL__" || (isWork ? record.name : record.student) === currentSelectedStudentFilter);
            return matchMonth && matchTarget;
        })
        .sort((a, b) => {
            return sortOrder === "asc" 
                ? (a.record.date || "").localeCompare(b.record.date || "") 
                : (b.record.date || "").localeCompare(a.record.date || "");
        });   
    
    // 渲染列表內容
    const fragment = document.createDocumentFragment();
    if (filtered.length === 0) {
        const tr = document.createElement("tr"); 
        tr.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-muted); padding:12px;">無紀錄</td>`; 
        fragment.appendChild(tr);
    } else {
        filtered.forEach(({ record, idx }) => { 
            const tr = document.createElement("tr");
            const dateStr = record.date || "";
            const dateParts = dateStr.split('-');
            const dateHtml = dateParts.length === 3 ? `${dateParts[0]}<br>${dateParts[1]}-${dateParts[2]}` : dateStr;

            // 將狀態文字替換為打勾或叉叉的圖示
            const statusIcon = record.status === "paid" ? "✔️" : "❌";

            tr.innerHTML = `
                <td style="line-height:1.2;">${dateHtml}</td>
                <td style="width: 1%;">
                    <div style="width: 3.5em; margin: 0 auto; text-align: center; white-space: normal; word-break: break-all;">
                        <strong>${escapeHtml(isWork ? record.name : record.student)}</strong>
                    </div>
                </td>
                <td style="white-space: nowrap; width: 1%;"><strong style="color:var(--primary);">$${record.total}</strong></td>
                <td style="text-align:center; width: 1%;"><span style="font-size: 0.9rem;">${statusIcon}</span></td>
                <td style="word-break: break-all;">${escapeHtml(record.notes || "-")}</td>
                <td style="text-align:center;">
                    <button class="gear-action-btn" onclick="openBillingActionMenu(${idx}, ${isWork})">⚙️</button>
                </td>`;
            fragment.appendChild(tr);
        });
    }
    
    tbody.innerHTML = ""; 
    tbody.appendChild(fragment);
    
    // 更新頂部總計數值
    const thTitle = document.getElementById("stat-total-hours");
    if (thTitle) thTitle.parentElement.style.display = "none";
    
    document.getElementById("stat-total-income").innerText = `$${tI.toLocaleString()}`; 
    document.getElementById("stat-unpaid").innerText = `$${tU.toLocaleString()}`;
}

// 帳務連動到收支管理的同步函式
async function syncBillingToFinance(billId, date, total, notes, isWork = false, status = "unpaid") {
    const finId = "fin_sync_" + billId; 
    const finIdx = state.finances.findIndex(f => f.id === finId);
    const amt = Math.round(Number(total));
    
    // 【修復2】依據狀態動態決定歸類：已繳(Income) / 未繳(Receivable)
    const fType = status === "paid" ? "income" : "receivable";
    const pCat = status === "paid" ? "💰 工作收入" : "📥 應收款項";
    const sCat = status === "paid" ? (isWork ? "兼職外快" : "家教收入") : "未結薪資";

    if (finIdx > -1) { 
        state.finances[finIdx].date = date; 
        state.finances[finIdx].amount = amt; 
        state.finances[finIdx].notes = notes; 
        state.finances[finIdx].type = fType;
        state.finances[finIdx].parentCat = pCat;
        state.finances[finIdx].subCat = sCat;
        
        if (fType === "receivable") {
            state.finances[finIdx].remaining = amt;
        } else {
            delete state.finances[finIdx].remaining;
        }
    } else { 
        state.finances.unshift({ 
            id: finId, 
            date, 
            type: fType, 
            parentCat: pCat, 
            subCat: sCat, 
            amount: amt, 
            remaining: fType === "receivable" ? amt : undefined, 
            notes, 
            isHidden: false 
        }); 
    }
}

// ================= 家教帳務 =================
function openBillingModal(idx = null) {
    currentEditingBillingIndex = idx; 
    const sel = document.getElementById("bill-student-select"); 
    sel.innerHTML = '<option value="">-- 現有家教 --</option>';
    
    new Set((state.schedules || []).flatMap(s => (s.tutorings || []).map(t => t.student))).forEach(s => { 
        if (s) sel.appendChild(new Option(s, s)); 
    });
    
    if (idx !== null) { 
        const item = state.billings[idx]; 
        ["date", "student", "hours", "rate", "total", "status", "notes"].forEach(k => { 
            document.getElementById(`bill-${k}`).value = item[k] || ""; 
        }); 
    } else { 
        ["student", "notes"].forEach(k => document.getElementById(`bill-${k}`).value = ""); 
        document.getElementById("bill-date").value = formatDate(new Date()); 
        document.getElementById("bill-hours").value = "2"; 
        document.getElementById("bill-status").value = "unpaid"; 
        updateBillingRateByDateAndStudent(); 
    }
    document.getElementById("billing-modal").classList.add("active");
}

function onSelectBillingStudent() { 
    document.getElementById("bill-student").value = document.getElementById("bill-student-select").value; 
    updateBillingRateByDateAndStudent(); 
}

function onBillingDateOrStudentChange() { 
    updateBillingRateByDateAndStudent(); 
}

function updateBillingRateByDateAndStudent() { 
    if (currentEditingBillingIndex !== null) return; 
    
    const name = document.getElementById("bill-student").value.trim(); 
    const tuts = (state.schedules || []).flatMap(s => (s.tutorings || []).filter(t => t.student === name)); 
    const targetDay = (parseLocalDate(document.getElementById("bill-date").value).getDay() || 7); 
    const targetTut = tuts.find(t => Number(t.day) === targetDay) || tuts[0] || { rate: "" };
    
    document.getElementById("bill-rate").value = targetTut.rate || ""; 
    calcBillAmount(); 
}

function calcBillAmount() { 
    const hours = Number(document.getElementById("bill-hours").value) || 0;
    const rate = Number(document.getElementById("bill-rate").value) || 0;
    document.getElementById("bill-total").value = Math.round(hours * rate); 
}

async function saveBillingRecord() {
    const date = document.getElementById("bill-date").value; 
    const student = document.getElementById("bill-student").value.trim();
    const hours = document.getElementById("bill-hours").value; 
    const rate = document.getElementById("bill-rate").value; 
    const total = document.getElementById("bill-total").value;
    
    if (!date || !student || !hours || !rate) { 
        showToast("請完整填寫！", "error"); 
        return; 
    }
    
    const status = document.getElementById("bill-status").value;
    const obj = { 
        id: currentEditingBillingIndex !== null ? state.billings[currentEditingBillingIndex].id : "bill_" + Date.now(), 
        date, 
        student, 
        hours, 
        rate, 
        total, 
        status: status, 
        notes: document.getElementById("bill-notes").value.trim() 
    };
    
    if (currentEditingBillingIndex !== null) { 
        state.billings[currentEditingBillingIndex] = obj; 
    } else { 
        state.billings.unshift(obj); 
    }
    
    await syncBillingToFinance(obj.id, date, total, `家教: ${student} (${hours}hr)`, false, status);
    
    saveToStorage(); 
    renderBillings(); 
    renderFinances(); 
    closeModal("billing-modal"); 
    showToast("帳務已儲存");
}

function toggleBillStatus(idx) { 
    const b = state.billings[idx]; 
    b.status = b.status === "paid" ? "unpaid" : "paid"; 
    syncBillingToFinance(b.id, b.date, b.total, `家教: ${b.student} (${b.hours}hr)`, false, b.status).then(() => {
        saveToStorage(); 
        renderBillings(); 
        if (typeof renderFinances === 'function') renderFinances();
    });
}

function deleteBilling(idx) { 
    showConfirm("確定刪除此帳務紀錄？", () => { 
        state.finances = state.finances.filter(f => f.id !== "fin_sync_" + state.billings[idx].id); 
        state.billings.splice(idx, 1); 
        saveToStorage(); 
        renderBillings(); 
        renderFinances(); 
        showToast("已刪除紀錄"); 
    }); 
}

// ================= 工作帳務 =================
function openWorkBillingModal(idx = null) {
    currentEditingWorkBillingIndex = idx; 
    const sel = document.getElementById("wbill-name-select"); 
    sel.innerHTML = '<option value="">-- 現有工作 --</option>';
    
    new Set((state.schedules || []).flatMap(s => (s.works || []).map(w => w.name))).forEach(n => { 
        if (n) sel.appendChild(new Option(n, n)); 
    });
    
    if (idx !== null) { 
        const item = state.workBillings[idx]; 
        ["date", "name", "hours", "rate", "total", "status", "notes"].forEach(k => {
            document.getElementById(`wbill-${k}`).value = item[k] || "";
        }); 
    } else { 
        ["name", "notes"].forEach(k => document.getElementById(`wbill-${k}`).value = ""); 
        document.getElementById("wbill-date").value = formatDate(new Date()); 
        document.getElementById("wbill-hours").value = "4"; 
        document.getElementById("wbill-status").value = "unpaid"; 
        updateWorkBillingRateByDateAndName(); 
    }
    document.getElementById("work-billing-modal").classList.add("active");
}

function onSelectBillingWork() { 
    document.getElementById("wbill-name").value = document.getElementById("wbill-name-select").value; 
    updateWorkBillingRateByDateAndName(); 
}

function onWorkBillingDateOrNameChange() { 
    updateWorkBillingRateByDateAndName(); 
}

function updateWorkBillingRateByDateAndName() { 
    if (currentEditingWorkBillingIndex !== null) return; 
    
    const name = document.getElementById("wbill-name").value.trim(); 
    const targetWork = ((state.schedules || []).flatMap(s => (s.works || []).filter(w => w.name === name))[0] || { rate: "" });
    
    document.getElementById("wbill-rate").value = targetWork.rate || ""; 
    calcWorkBillAmount(); 
}

function calcWorkBillAmount() { 
    const hours = Number(document.getElementById("wbill-hours").value) || 0;
    const rate = Number(document.getElementById("wbill-rate").value) || 0;
    document.getElementById("wbill-total").value = Math.round(hours * rate); 
}

async function saveWorkBillingRecord() {
    const date = document.getElementById("wbill-date").value; 
    const name = document.getElementById("wbill-name").value.trim();
    const hours = document.getElementById("wbill-hours").value; 
    const rate = document.getElementById("wbill-rate").value; 
    const total = document.getElementById("wbill-total").value;
    
    if (!date || !name || !hours || !rate) { 
        showToast("請完整填寫！", "error"); 
        return; 
    }
    
    const status = document.getElementById("wbill-status").value;
    const obj = { 
        id: currentEditingWorkBillingIndex !== null ? state.workBillings[currentEditingWorkBillingIndex].id : "wbill_" + Date.now(), 
        date, 
        name, 
        hours, 
        rate, 
        total, 
        status: status, 
        notes: document.getElementById("wbill-notes").value.trim() 
    };
    
    if (currentEditingWorkBillingIndex !== null) { 
        state.workBillings[currentEditingWorkBillingIndex] = obj; 
    } else { 
        state.workBillings.unshift(obj); 
    }
    
    await syncBillingToFinance(obj.id, date, total, `工作: ${name} (${hours}hr)`, true, status);
    
    saveToStorage(); 
    renderBillings(); 
    renderFinances(); 
    closeModal("work-billing-modal"); 
    showToast("帳務已儲存");
}

function toggleWorkBillStatus(idx) { 
    const b = state.workBillings[idx]; 
    b.status = b.status === "paid" ? "unpaid" : "paid"; 
    syncBillingToFinance(b.id, b.date, b.total, `工作: ${b.name} (${b.hours}hr)`, true, b.status).then(() => {
        saveToStorage(); 
        renderBillings(); 
        if (typeof renderFinances === 'function') renderFinances();
    });
}

function deleteWorkBilling(idx) { 
    showConfirm("確定刪除此帳務紀錄？", () => { 
        state.finances = state.finances.filter(f => f.id !== "fin_sync_" + state.workBillings[idx].id); 
        state.workBillings.splice(idx, 1); 
        saveToStorage(); 
        renderBillings(); 
        renderFinances(); 
        showToast("已刪除紀錄"); 
    }); 
}

// ========================================================
// 收支管理 (Finance)
// ========================================================

function toggleFinanceChart(type) { 
    triggerHaptic(20); 
    const mode = type === 'expense' ? 'all_expense' : 'all_income';
    const container = document.getElementById("finance-chart-container"); 
    
    // 如果已經在看這個圖表，再次點擊就關閉
    if (financeActiveMode === mode) {
        financeActiveMode = "all";
        container.classList.remove("active");
    } else {
        financeActiveMode = mode; 
        financeActiveMainCat = "all"; 
        financeActiveSubCat = "all"; 
        container.classList.add("active");
    }
    renderFinances(); 
}

// 渲染財務圓餅圖
function renderChartData() {
    const container = document.getElementById("finance-chart-content"); 
    container.innerHTML = ""; 
    
    const titleEl = document.getElementById("finance-chart-title");
    const selectedMonth = document.getElementById("fin-month-filter").value; 
    
    const isExpense = financeActiveMode === "all_expense";
    const typeStr = isExpense ? "支出" : "收入";
    const timeStr = selectedMonth ? "當月" : "全期間";
    
    if (titleEl) titleEl.innerText = `${timeStr}${typeStr}佔比`;

    let totalAmt = 0; 
    const catSums = {};
    
    (state.finances || []).forEach(item => { 
        if (item.isHidden && !state.showHiddenItems) return; 
        if (isExpense && item.type !== "expense") return; 
        if (!isExpense && item.type !== "income") return; 
        if (selectedMonth && (item.date || "").slice(0, 7) !== selectedMonth) return; 
        
        const amt = Number(item.amount || 0); 
        totalAmt += amt; 
        
        if (!catSums[item.parentCat]) catSums[item.parentCat] = 0; 
        catSums[item.parentCat] += amt; 
    });
    
    if (totalAmt === 0) { 
        container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted);">無${typeStr}資料</div>`; 
        return; 
    }
    
    const data = Object.keys(catSums)
        .map(cat => ({ cat, amt: catSums[cat], pct: catSums[cat] / totalAmt }))
        .sort((a, b) => b.amt - a.amt); 
        
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#14b8a6', '#f43f5e'];
    if (!isExpense) colors.reverse(); // 讓收入的顏色分佈有些微差異
    
    let svgHTML = `<svg width="120" height="120" viewBox="0 0 32 32" style="transform: rotate(-90deg); border-radius:50%;">`;
    let offset = 0; 
    const C = 2 * Math.PI * 10;
    
    data.forEach((item, idx) => { 
        item.color = colors[idx % colors.length]; 
        const slice = item.pct * C; 
        svgHTML += `<circle r="10" cx="16" cy="16" fill="transparent" stroke="${item.color}" stroke-width="6" stroke-dasharray="${slice} ${C}" stroke-dashoffset="${-offset}"></circle>`; 
        offset += slice; 
    }); 
    svgHTML += `</svg>`;
    
    let legendHTML = `<div style="display:flex; flex-direction:column; gap:4px;">`; 
    data.forEach(item => { 
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background:${item.color};"></div>
                <span>${escapeHtml(item.cat)}: ${Math.round(item.pct * 100)}% ($${item.amt.toLocaleString()})</span>
            </div>`; 
    }); 
    legendHTML += `</div>`; 
    
    container.innerHTML = svgHTML + legendHTML;
}

function setFinanceMonthCurrent() { 
    const now = new Date(); 
    document.getElementById("fin-month-filter").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; 
    renderFinances(); 
}

function setFinanceMonthAll() { 
    document.getElementById("fin-month-filter").value = ""; 
    renderFinances(); 
}

function setFinanceAllMode(mode) { 
    financeActiveMode = mode; 
    financeActiveMainCat = "all"; 
    financeActiveSubCat = "all"; 
    
    const chartContainer = document.getElementById("finance-chart-container");
    if (chartContainer) {
        if (mode === "all_expense" || mode === "all_income") {
            chartContainer.classList.add("active");
        } else {
            chartContainer.classList.remove("active");
        }
    }
    renderFinances(); 
}

function selectFinanceMainCategory(cat) { 
    financeActiveMode = "main"; 
    financeActiveMainCat = cat; 
    financeActiveSubCat = "all"; 
    renderFinances(); 
}

function selectFinanceSubCategory(cat) { 
    financeActiveMode = "sub"; 
    financeActiveSubCat = cat; 
    renderFinances(); 
}

function toggleShowHiddenItems() { 
    triggerHaptic(20);
    state.showHiddenItems = !state.showHiddenItems; 
    saveToStorage(); 
    updateSettingsUI();
    if (typeof renderFinances === 'function') renderFinances(); 
}

function toggleRecordHidden(id) { 
    const item = state.finances.find(f => f.id === id); 
    if (item) { 
        item.isHidden = !item.isHidden; 
        saveToStorage(); 
        renderFinances(); 
    } 
}

function onFinanceTypeChange() { 
    const pSel = document.getElementById("fin-parent-cat"); 
    pSel.innerHTML = ""; 
    
    getCategoryKeys(document.getElementById("fin-type").value).forEach(p => {
        pSel.appendChild(new Option(p, p));
    }); 
    
    onFinanceParentCatChange(); 
    
    const type = document.getElementById("fin-type").value; 
    const wrap = document.getElementById("fin-friend-wrap");
    
    if (wrap) {
        if (type === 'receivable' || type === 'payable') { 
            wrap.style.display = "block"; 
        } else { 
            wrap.style.display = "none"; 
            document.getElementById("fin-friend-select").value = ""; 
        }
    }
}

function onFinanceParentCatChange() { 
    const sSel = document.getElementById("fin-sub-cat"); 
    sSel.innerHTML = ""; 
    
    (getCategories()[document.getElementById("fin-type").value][document.getElementById("fin-parent-cat").value] || []).forEach(s => {
        sSel.appendChild(new Option(s, s));
    }); 
}

function populateFriendSelects() {
    const finSel = document.getElementById('fin-friend-select'); 
    if (!finSel) return;
    
    finSel.innerHTML = '<option value="">-- 不發送 --</option>';
    if (!currentUser || !connectionsList) return;
    
    connectionsList.forEach(c => { 
        if (c.status !== 'accepted') return;
        let friend = null;
        
        if (String(c.requester_id) === String(currentUser.id)) {
            friend = c.receiver;
        } else if (String(c.receiver_id) === String(currentUser.id)) {
            friend = c.requester;
        }
        
        if (Array.isArray(friend)) friend = friend[0];
        
        if (friend) {
            finSel.appendChild(new Option(friend.nickname || friend.email || `好友 (${friend.id.substring(0, 6)})`, friend.id)); 
        }
    });
}

function openFinanceModal(id = null) {
    if (id && id.startsWith("fin_sync_")) {
        showToast("連動的帳務紀錄無法在此編輯，請至打工/家教帳務修改", "error");
        return;
    }
    
    if (currentUser) { 
        fetchConnections().then(() => populateFriendSelects()); 
    } else { 
        populateFriendSelects(); 
    }
    
    document.getElementById("fin-edit-id").value = id || "";
    if (document.getElementById("fin-friend-select")) {
        document.getElementById("fin-friend-select").value = "";
    }
    
    if (id) { 
        const item = state.finances.find(f => f.id === id); 
        if (item.subCat === "還款" && item.targetDebtId) {
            showToast("還款紀錄無法直接編輯，請刪除後重新操作", "error");
            return;
        }
        
        document.getElementById("fin-modal-title").innerText = "編輯收支"; 
        document.getElementById("fin-date").value = item.date; 
        document.getElementById("fin-type").value = item.type; 
        onFinanceTypeChange(); 
        
        document.getElementById("fin-parent-cat").value = item.parentCat; 
        onFinanceParentCatChange(); 
        
        document.getElementById("fin-sub-cat").value = item.subCat; 
        document.getElementById("fin-amount").value = item.amount; 
        document.getElementById("fin-notes").value = item.notes || ""; 
    } else { 
        document.getElementById("fin-modal-title").innerText = "新增收支"; 
        document.getElementById("fin-date").value = formatDate(new Date()); 
        document.getElementById("fin-type").value = "expense"; 
        onFinanceTypeChange(); 
        
        document.getElementById("fin-amount").value = ""; 
        document.getElementById("fin-notes").value = ""; 
    }
    document.getElementById("finance-modal").classList.add("active");
}

async function saveFinanceRecord() {
    const id = document.getElementById("fin-edit-id").value; 
    const date = document.getElementById("fin-date").value;
    const type = document.getElementById("fin-type").value; 
    const parentCat = document.getElementById("fin-parent-cat").value; 
    const subCat = document.getElementById("fin-sub-cat").value;
    const amount = Math.round(Number(document.getElementById("fin-amount").value)); 
    const notes = document.getElementById("fin-notes").value.trim();
    
    const friendSel = document.getElementById('fin-friend-select'); 
    const friendId = friendSel ? friendSel.value : null;
    
    if (!date || !amount) { 
        showToast("填寫完整！", "error"); 
        return; 
    }

    try {
        if (id) { 
            const idx = state.finances.findIndex(f => f.id === id); 
            const oldItem = state.finances[idx]; 
            const isShared = !!(oldItem.linkedFriendId || oldItem.targetDebtId);
            const isCreditor = oldItem.type === 'receivable' || (oldItem.type === 'income' && oldItem.subCat === '還款');

            if (isShared && !isCreditor) { 
                showToast("只有應收方可以修改連線紀錄！", "error"); 
                return; 
            }
            
            if (isShared && isCreditor && oldItem.linkedFriendId && currentUser) {
                 if (amount !== oldItem.amount || notes !== oldItem.notes) {
                     await supabaseClient.from('user_messages').insert({ 
                         sender_id: currentUser.id, 
                         receiver_id: oldItem.linkedFriendId, 
                         type: 'edit_request', 
                         payload: { sourceId: id, targetDebtId: oldItem.targetDebtId, amount, notes } 
                     });
                     showToast("已發送修改請求給對方，待對方同意後同步更新！"); 
                     closeModal("finance-modal"); 
                     return;
                 }
            }
            
            if (oldItem.targetDebtId && oldItem.subCat === "還款") { 
                const diff = Math.round(amount - oldItem.amount); 
                const targetDebt = state.finances.find(f => f.id === oldItem.targetDebtId); 
                if (targetDebt && targetDebt.remaining !== undefined) {
                    targetDebt.remaining = Math.round(targetDebt.remaining - diff); 
                }
            } 
            
            state.finances[idx] = { ...oldItem, date, type, parentCat, subCat, amount, notes }; 
        } else { 
            const newId = "fin_" + Date.now();
            
            if (friendId && currentUser) {
                let actionType = ''; 
                if (type === 'receivable') {
                    actionType = 'lend_request'; 
                } else if (type === 'payable') {
                    actionType = 'borrow_request';
                }
                
                if (actionType) {
                    state.finances.unshift({ 
                        id: newId, 
                        date, 
                        type, 
                        parentCat, 
                        subCat, 
                        amount, 
                        notes, 
                        remaining: amount, 
                        isHidden: false, 
                        isPending: true, 
                        linkedFriendId: friendId 
                    });
                    
                    await supabaseClient.from('user_messages').insert({ 
                        sender_id: currentUser.id, 
                        receiver_id: friendId, 
                        type: actionType, 
                        payload: { sourceId: newId, amount, notes } 
                    });
                    
                    showToast("已發送請求給好友，等待對方同意確認！"); 
                    saveToStorage(); 
                    renderFinances(); 
                    closeModal("finance-modal"); 
                    return;
                }
            }
            
            state.finances.unshift({ 
                id: newId, 
                date, 
                type, 
                parentCat, 
                subCat, 
                amount, 
                notes, 
                remaining: (type === "receivable" || type === "payable") ? amount : undefined, 
                isHidden: false, 
                isPending: false 
            }); 
        }

        saveToStorage(); 
        renderFinances(); 
        closeModal("finance-modal"); 
        showToast("收支紀錄已儲存");
        
    } catch (e) { 
        console.error("儲存收支失敗:", e); 
        showToast("儲存失敗，請重試", "error"); 
    }
}

function openRepayModal(id) { 
    const item = state.finances.find(f => f.id === id); 
    document.getElementById("repay-id").value = id; 
    document.getElementById("repay-info").value = `[${item.subCat}] 未結清: $${(item.remaining !== undefined ? item.remaining : item.amount)}`; 
    document.getElementById("repay-date").value = formatDate(new Date()); 
    document.getElementById("repay-amount").value = (item.remaining !== undefined ? item.remaining : item.amount); 
    document.getElementById("repay-notes").value = ""; 
    document.getElementById("repay-modal").classList.add("active"); 
}

async function confirmRepay() {
    const id = document.getElementById("repay-id").value; 
    const date = document.getElementById("repay-date").value;
    const amt = Math.round(Number(document.getElementById("repay-amount").value)); 
    const notes = document.getElementById("repay-notes").value.trim();
    
    const item = state.finances.find(f => f.id === id); 
    const rem = item.remaining !== undefined ? item.remaining : item.amount;
    
    if (!date || amt <= 0 || amt > rem) { 
        showToast("金額錯誤！請輸入大於零的有效金額。", "error"); 
        return; 
    }
    
    const isShared = !!item.linkedFriendId;

    try {
        if (isShared && currentUser) {
            const repayId = "fin_repay_" + Date.now();
            
            state.finances.unshift({ 
                id: repayId, 
                targetDebtId: id, 
                sharedId: repayId, 
                date, 
                type: item.type === "receivable" ? "income" : "expense", 
                parentCat: item.type === "receivable" ? "💰 工作收入" : "📦 其他", 
                subCat: "還款", 
                amount: amt, 
                notes: notes, 
                linkedFriendId: item.linkedFriendId, 
                isPending: true, 
                isHidden: false 
            });
            
            await supabaseClient.from('user_messages').insert({ 
                sender_id: currentUser.id, 
                receiver_id: item.linkedFriendId, 
                type: 'repay_request', 
                payload: { sourceId: repayId, targetDebtId: item.targetDebtId || id, amount: amt, notes: notes } 
            });
            
            showToast("還款/收款請求已發送給對方，等待對方確認！");
        } else {
            item.remaining = Math.round(rem - amt);
            
            state.finances.unshift({ 
                id: "fin_repay_" + Date.now(), 
                targetDebtId: id, 
                date, 
                type: item.type === "receivable" ? "income" : "expense", 
                parentCat: item.type === "receivable" ? "💰 工作收入" : "📦 其他", 
                subCat: "還款", 
                amount: amt, 
                notes: notes, 
                linkedFriendId: item.linkedFriendId, 
                isPending: false, 
                isHidden: false 
            });
            
            showToast("還款紀錄已建立！");
        }
        
        saveToStorage(); 
        renderFinances(); 
        closeModal("repay-modal");
        
    } catch (e) { 
        console.error("還款處理失敗:", e); 
        showToast("還款處理失敗", "error"); 
    }
}

window.deleteFinanceRecord = function(id) {
    if (id && id.startsWith("fin_sync_")) {
        showToast("連動的帳務紀錄無法在此刪除，請至打工/家教帳務修改", "error");
        return;
    }
    
    const target = state.finances.find(f => f.id === id); 
    if (!target) return;
    
    const isShared = !!(target.linkedFriendId || target.targetDebtId);
    const isCreditor = target.type === 'receivable' || (target.type === 'income' && target.subCat === '還款');

    if (isShared && !isCreditor && target.subCat !== "還款") { 
        showToast("只有應收方可以發起刪除主借款紀錄！", "error"); 
        return; 
    }

    // 將真實刪除的邏輯封裝成一個小函數，方便後續呼叫
    const proceedDelete = () => {
        if (target.subCat === "還款" && target.targetDebtId) { 
            const m = state.finances.find(f => f.id === target.targetDebtId); 
            if (m && m.remaining !== undefined) {
                m.remaining = Math.round(m.remaining + target.amount); 
            }
        }
        state.finances = state.finances.filter(f => f.id !== id); 
        saveToStorage(); 
        renderFinances(); 
        showToast("已刪除紀錄");
    };

    if (target.subCat === "還款") {
        if (target.isPending) { 
            proceedDelete(); 
        } else if (target.linkedFriendId && currentUser) {
            showConfirm("此為連線還款紀錄，確定發送刪除請求？", async () => {
                await supabaseClient.from('user_messages').insert({ 
                    sender_id: currentUser.id, 
                    receiver_id: target.linkedFriendId, 
                    type: 'delete_repay_request', 
                    payload: { sourceId: target.sharedId || target.id, targetDebtId: target.targetDebtId, amount: target.amount } 
                });
                showToast("已發送還款刪除請求，待對方同意後同步刪除！"); 
            });
        } else {
            showConfirm("確定刪除此還款紀錄？主借款金額將會復原。", proceedDelete);
        }
    } else if (isShared && isCreditor && target.linkedFriendId && currentUser) {
        showConfirm("此為連線紀錄，確定發送刪除請求？（將連帶刪除相關還款紀錄）", async () => {
            await supabaseClient.from('user_messages').insert({ 
                sender_id: currentUser.id, 
                receiver_id: target.linkedFriendId, 
                type: 'delete_request', 
                payload: { sourceId: id, targetDebtId: target.targetDebtId, amount: target.amount } 
            });
            showToast("已發送刪除請求，待對方同意後同步刪除！"); 
        });
    } else {
        if (target.type === "receivable" || target.type === "payable") { 
            const relatedRepayments = state.finances.filter(f => f.targetDebtId === id); 
            if (relatedRepayments.length > 0) { 
                showConfirm("此紀錄包含已還款紀錄，確定要連帶刪除嗎？", () => {
                    state.finances = state.finances.filter(f => f.targetDebtId !== id);
                    proceedDelete();
                });
            } else { 
                showConfirm("確定刪除此紀錄？", proceedDelete);
            } 
        } else { 
            showConfirm("確定刪除此紀錄？", proceedDelete);
        }
    }
};

function renderFinances() {
    const tbody = document.getElementById("finance-body"); 
    const selectedMonth = document.getElementById("fin-month-filter").value; 
    const sortOrder = document.getElementById("fin-sort-order").value; 

    const btnFinCur = document.getElementById("btn-fin-month-current");
    const btnFinAll = document.getElementById("btn-fin-month-all");
    
    if (btnFinCur && btnFinAll) {
        btnFinCur.className = selectedMonth ? "btn" : "btn btn-secondary";
        btnFinAll.className = !selectedMonth ? "btn" : "btn btn-secondary";
    }

    let tE = 0, tI = 0, tR = 0, tP = 0;
    
    (state.finances || []).forEach((item) => { 
        if (item.isPending) return; 
        
        const amt = Number(item.amount || 0); 
        const rem = item.remaining !== undefined ? item.remaining : amt; 
        const mo = (item.date || '').slice(0, 7); 
        
        if (item.type === "receivable" && (rem > 0 || !selectedMonth || mo === selectedMonth)) {
            tR += rem; 
        }
        if (item.type === "payable" && (rem > 0 || !selectedMonth || mo === selectedMonth)) {
            tP += rem; 
        }
        
        if (item.isHidden && !state.showHiddenItems) return; 
        if (selectedMonth && mo !== selectedMonth) return; 
        
        if (item.type === "expense") tE += amt; 
        if (item.type === "income") tI += amt; 
    });
    
    const chips = document.getElementById("finance-filter-chips"); 
    let chipsHtml = `<div class="finance-chip ${financeActiveMode === "all" ? "active" : ""}" onclick="setFinanceAllMode('all')">全部類型</div>`; 
    const cats = getCategories(); 
    
    if (financeActiveMode.startsWith("all")) { 
        Object.keys(cats).forEach(k => {
            getCategoryKeys(k).forEach(p => { 
                chipsHtml += `<div class="finance-chip" onclick="selectFinanceMainCategory('${escapeJS(p)}')">${escapeHtml(p)}</div>`; 
            });
        }); 
    } else { 
        chipsHtml += `
            <div class="finance-chip" style="background:var(--primary);color:#fff;" onclick="setFinanceAllMode('all')">◀ 返回</div>
            <div class="finance-chip ${financeActiveSubCat === "all" ? "active" : ""}" onclick="selectFinanceSubCategory('all')">全部 (${escapeHtml(financeActiveMainCat)})</div>
        `; 
        
        let subs = []; 
        Object.values(cats).forEach(t => { 
            if (t[financeActiveMainCat]) subs = t[financeActiveMainCat]; 
        }); 
        
        subs.forEach(s => { 
            chipsHtml += `<div class="finance-chip ${financeActiveSubCat === s ? "active" : ""}" onclick="selectFinanceSubCategory('${escapeJS(s)}')">${escapeHtml(s)}</div>`; 
        }); 
    } 
    chips.innerHTML = chipsHtml;
    
    const lbls = { 
        expense: { n: "支出", c: "tag-expense" }, 
        income: { n: "收入", c: "tag-income" }, 
        transfer: { n: "轉帳", c: "tag-paid" }, 
        receivable: { n: "應收", c: "tag-receivable" }, 
        payable: { n: "應付", c: "tag-payable" } 
    }; 
    
    const filteredFinances = state.finances.filter(i => { 
        if (i.isPending) return false; 
        if (i.isHidden && !state.showHiddenItems) return false; 
        
        const mo = (i.date || '').slice(0, 7); 
        const rem = i.remaining !== undefined ? i.remaining : i.amount; 
        
        if (i.type === "receivable" || i.type === "payable") { 
            if (rem === 0 && selectedMonth && mo !== selectedMonth) return false; 
        } else { 
            if (selectedMonth && mo !== selectedMonth) return false; 
        } 
        
        if (financeActiveMode === "all_expense" && i.type !== "expense") return false; 
        if (financeActiveMode === "all_income" && i.type !== "income") return false; 
        if (financeActiveMode === "all_receivable" && i.type !== "receivable") return false; 
        if (financeActiveMode === "all_payable" && i.type !== "payable") return false; 
        if (financeActiveMode === "main" && (i.parentCat !== financeActiveMainCat || (financeActiveSubCat !== "all" && i.subCat !== financeActiveSubCat))) return false; 
        if (financeActiveMode === "sub" && i.subCat !== financeActiveSubCat) return false; 
        
        return true; 
    }).sort((a, b) => {
        return sortOrder === "asc" 
            ? (a.date || "").localeCompare(b.date || "") 
            : (b.date || "").localeCompare(a.date || "");
    });

    const fragment = document.createDocumentFragment();
    
    if (filteredFinances.length === 0) {
        const tr = document.createElement("tr"); 
        tr.innerHTML = `<td colspan="5" style="text-align:center; padding:12px;">無紀錄</td>`; 
        fragment.appendChild(tr);
    } else {
        filteredFinances.forEach(i => {
            const amt = Number(i.amount); 
            const rem = i.remaining !== undefined ? i.remaining : amt; 
            const tl = lbls[i.type]; 
            
            const isShared = !!(i.linkedFriendId || i.targetDebtId); 
            const isCreditor = i.type === 'receivable' || (i.type === 'income' && i.subCat === '還款');

            let ex = `<button class="gear-action-btn" onclick="openFinanceActionMenu('${i.id}')">⚙️</button>`;

            let dAmt = `${(i.type === 'income' || i.type === 'receivable') ? '+' : '-'}$${amt.toLocaleString()}`;
            if ((i.type === 'receivable' || i.type === 'payable') && rem > 0) {
                dAmt += ` (未結:$${rem})`;
            }
            
            const tr = document.createElement("tr"); 
            tr.style.cssText = i.isHidden ? 'opacity:0.55;' : '';
            
            const dateStr = i.date || "";
            const dateParts = dateStr.split('-');
            const dateHtml = dateParts.length === 3 ? `${dateParts[0]}<br>${dateParts[1]}-${dateParts[2]}` : dateStr;
            const strippedParentCat = (i.parentCat || "").replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '');
            
            tr.innerHTML = `
                <td style="line-height:1.2;">
                    ${dateHtml}<br>
                    <span class="${tl.c}" style="display:inline-block; margin-top:4px;">${tl.n}</span>
                </td>
                <td>
                    <strong>${escapeHtml(strippedParentCat)}</strong><br>
                    <span style="color:var(--text-muted); font-size:0.75rem;">${escapeHtml(i.subCat)}</span> 
                    ${i.isHidden ? '<span class="tag-hidden">隱藏</span>' : ''}
                </td>
                <td>
                    <strong style="color:${(i.type === 'income' || i.type === 'receivable') ? '#10b981' : '#ef4444'};">
                        ${dAmt}
                    </strong>
                </td>
                <td>${escapeHtml(i.notes || "-")}</td>
                <td style="text-align:center;">${ex}</td>`;
                
            fragment.appendChild(tr);
        });
    }
    
    tbody.innerHTML = ""; 
    tbody.appendChild(fragment);
    
    document.getElementById("fin-stat-expense").innerText = `$${tE.toLocaleString()}`; 
    document.getElementById("fin-stat-income").innerText = `$${tI.toLocaleString()}`; 
    document.getElementById("fin-stat-receivable").innerText = `$${tR.toLocaleString()}`; 
    document.getElementById("fin-stat-payable").innerText = `$${tP.toLocaleString()}`; 
    
    const balanceEl = document.getElementById("fin-stat-balance");
    balanceEl.innerText = `$${(tI - tE).toLocaleString()}`; 
    balanceEl.style.color = (tI - tE) >= 0 ? "#10b981" : "#ef4444";
    
    if (financeActiveMode === "all_expense" || financeActiveMode === "all_income") {
        renderChartData();
    }
}
// ========================================================
// 類別與固定收支管理
// ========================================================

// 檢查並觸發固定收支
function checkRecurringFinances() {
    if (!state.recurringFinances) state.recurringFinances = []; 
    let modified = false; 
    
    const today = new Date(); 
    const curYear = today.getFullYear(); 
    const curMonth = today.getMonth() + 1; 
    const curDay = today.getDate();
    
    state.recurringFinances.forEach(item => {
        // 若沒有上次觸發紀錄，預設為上個月
        if (!item.lastTriggeredMonth) { 
            item.lastTriggeredMonth = `${curMonth === 1 ? curYear - 1 : curYear}-${String(curMonth === 1 ? 12 : curMonth - 1).padStart(2, '0')}`; 
        }
        
        let [lastY, lastM] = item.lastTriggeredMonth.split('-').map(Number); 
        let checkY = lastY; 
        let checkM = lastM + 1; 
        
        if (checkM > 12) { 
            checkM = 1; 
            checkY++; 
        }
        
        // 迴圈檢查直到這個月
        while (checkY < curYear || (checkY === curYear && checkM <= curMonth)) {
            const daysInCheckMonth = new Date(checkY, checkM, 0).getDate(); 
            const targetDay = Math.min(item.dayOfMonth, daysInCheckMonth);
            
            // 如果這個月還沒到設定日期，就跳出
            if (checkY === curYear && checkM === curMonth && curDay < targetDay) break;
            
            const entryDate = `${checkY}-${String(checkM).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
            if (!state.finances) state.finances = []; 
            
            state.finances.unshift({ 
                id: "fin_rec_" + Date.now() + Math.floor(Math.random() * 1000), 
                date: entryDate, 
                type: item.type, 
                parentCat: item.parentCat, 
                subCat: item.subCat, 
                amount: Math.round(Number(item.amount)), 
                notes: item.notes || "固定收支", 
                remaining: (item.type === 'receivable' || item.type === 'payable') ? Math.round(Number(item.amount)) : undefined, 
                isHidden: false 
            });
            
            item.lastTriggeredMonth = `${checkY}-${String(checkM).padStart(2, '0')}`; 
            modified = true; 
            
            checkM++; 
            if (checkM > 12) { 
                checkM = 1; 
                checkY++; 
            }
        }
    });
    
    if (modified) { 
        saveToStorage(); 
        renderFinances(); 
    }
}

// 開啟固定收支管理列表
function openRecurringModal() { 
    const listEl = document.getElementById("recurring-list"); 
    listEl.innerHTML = ""; 
    const fragment = document.createDocumentFragment();
    
    (state.recurringFinances || []).forEach(item => { 
        const el = document.createElement("div"); 
        el.className = "recurring-manage-item"; 
        el.innerHTML = `
            <div>
                <strong style="color:var(--primary);">每月 ${item.dayOfMonth} 日</strong> - 
                [${item.type === 'income' ? '收入' : '支出'}] ${escapeHtml(item.subCat)} ($${item.amount})<br>
                <span style="font-size:0.65rem; color:var(--text-muted);">${escapeHtml(item.notes)}</span>
            </div>
            <div>
                <button class="btn btn-secondary" style="padding:2px 6px; font-size:0.68rem;" onclick="openAddRecurringModal('${item.id}')">編輯</button> 
                <button class="btn btn-danger" style="padding:2px 6px; font-size:0.68rem;" onclick="deleteRecurringRecord('${item.id}')">刪除</button>
            </div>
        `; 
        fragment.appendChild(el); 
    }); 
    
    listEl.appendChild(fragment); 
    document.getElementById("recurring-modal").classList.add("active"); 
}

function openAddRecurringModal(id = null) { 
    document.getElementById("rec-edit-id").value = id || ""; 
    
    if (id) { 
        const item = state.recurringFinances.find(r => r.id === id); 
        document.getElementById("rec-modal-title").innerText = "編輯固定收支"; 
        
        ["day", "type", "amount", "notes"].forEach(k => { 
            document.getElementById(`rec-${k}`).value = item[k.replace(/-([a-z])/g, g => g[1].toUpperCase())] || ""; 
        }); 
        
        onRecurringTypeChange(); 
        document.getElementById("rec-parent-cat").value = item.parentCat; 
        onRecurringParentCatChange(); 
        document.getElementById("rec-sub-cat").value = item.subCat; 
    } else { 
        document.getElementById("rec-modal-title").innerText = "新增固定收支"; 
        ["day", "amount", "notes"].forEach(k => document.getElementById(`rec-${k}`).value = ""); 
        document.getElementById("rec-type").value = "expense"; 
        onRecurringTypeChange(); 
    } 
    
    document.getElementById("recurring-modal").classList.remove("active"); 
    document.getElementById("recurring-edit-modal").classList.add("active"); 
}

function onRecurringTypeChange() { 
    const pSel = document.getElementById("rec-parent-cat"); 
    pSel.innerHTML = ""; 
    getCategoryKeys(document.getElementById("rec-type").value).forEach(p => pSel.appendChild(new Option(p, p))); 
    onRecurringParentCatChange(); 
}

function onRecurringParentCatChange() { 
    const sSel = document.getElementById("rec-sub-cat"); 
    sSel.innerHTML = ""; 
    (getCategories()[document.getElementById("rec-type").value][document.getElementById("rec-parent-cat").value] || []).forEach(s => sSel.appendChild(new Option(s, s))); 
}

function saveRecurringRecord() { 
    const id = document.getElementById("rec-edit-id").value; 
    const dayOfMonth = Number(document.getElementById("rec-day").value);
    const type = document.getElementById("rec-type").value; 
    const parentCat = document.getElementById("rec-parent-cat").value;
    const subCat = document.getElementById("rec-sub-cat").value; 
    const amount = Math.round(Number(document.getElementById("rec-amount").value));
    const notes = document.getElementById("rec-notes").value.trim(); 
    
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31 || !amount) { 
        showToast("請正確填寫日期(1~31)與金額！", "error"); 
        return; 
    }
    
    if (!state.recurringFinances) state.recurringFinances = []; 
    
    const obj = { 
        id: id || "rec_" + Date.now(), 
        dayOfMonth, 
        type, 
        parentCat, 
        subCat, 
        amount, 
        notes, 
        lastTriggeredMonth: id ? state.recurringFinances.find(r => r.id === id).lastTriggeredMonth : "" 
    }; 
    
    if (id) { 
        const idx = state.recurringFinances.findIndex(r => r.id === id); 
        state.recurringFinances[idx] = obj; 
    } else { 
        state.recurringFinances.push(obj); 
    }
    
    saveToStorage(); 
    checkRecurringFinances(); 
    closeModal("recurring-edit-modal"); 
    openRecurringModal(); 
    showToast("固定收支已儲存"); 
}

function deleteRecurringRecord(id) { 
    showConfirm("確定刪除此自動收支設定？", () => { 
        state.recurringFinances = state.recurringFinances.filter(r => r.id !== id); 
        saveToStorage(); 
        openRecurringModal(); 
        showToast("已刪除設定"); 
    }); 
}

// ========================================================
// 類別管理 (拖曳排序、新增、搬移、刪除)
// ========================================================

function openCategoryManageModal() { 
    document.getElementById("cat-manage-type").value = "expense"; 
    renderCategoryManageList(); 
    document.getElementById("category-manage-modal").classList.add("active"); 
}

function resetCategoriesToDefault() { 
    showConfirm("確定恢復預設類別？(您自訂的類別將會消失)", () => { 
        state.customCategories = structuredClone(DEFAULT_CATEGORIES); 
        state.categoryOrder = null; 
        saveToStorage(); 
        renderCategoryManageList(); 
        renderFinances(); 
        showToast("已恢復預設類別"); 
    }); 
}

function renderCategoryManageList() { 
    const t = document.getElementById("cat-manage-type").value; 
    const list = document.getElementById("cat-manage-list"); 
    const cats = getCategories()[t] || {}; 
    let listHtml = ""; 
    
    getCategoryKeys(t).forEach((p, pi) => { 
        listHtml += `
        <div class="draggable-cat-main" data-main="${escapeHtml(p)}" style="margin-bottom:10px; border:1px solid var(--border); border-radius:8px; background:var(--card-bg); transition:transform 0.2s;">
            <div style="font-weight:700; font-size:0.85rem; padding:8px 10px; background:var(--table-th-bg); border-bottom:1px solid var(--border); border-radius:8px 8px 0 0; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div class="drag-handle-main" style="color:var(--text-muted); cursor:grab; padding:2px; font-size:1.1rem; user-select:none;">☰</div>
                    <span>${escapeHtml(p)}</span>
                </div>
            </div>
            <div class="cat-sub-list" data-main="${escapeHtml(p)}" style="padding:0;">
        `; 
        
        (cats[p] || []).forEach((s, si) => { 
            listHtml += `
                <div class="cat-manage-item draggable-cat-sub" data-sub="${escapeHtml(s)}" data-idx="${si}" style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--card-bg); border-bottom:1px dashed var(--border); transition:transform 0.2s;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div class="drag-handle-sub" style="color:var(--text-muted); cursor:grab; padding:2px; font-size:1.1rem; user-select:none;">☰</div>
                        <span>└ ${escapeHtml(s)}</span>
                    </div>
                    <div class="cat-manage-actions">
                        <button class="gear-action-btn" style="padding:2px 8px; font-size:1.1rem;" onclick="openCategoryActionMenu('${escapeJS(t)}', '${escapeJS(p)}', ${si}, '${escapeJS(s)}')">⚙️</button>
                    </div>
                </div>
            `; 
        }); 
        
        // 修正最後一項的虛線底線
        listHtml = listHtml.replace(/border-bottom:1px dashed var\(--border\);(?=[^<]*<\/div>\s*<\/div>\s*<\/div>$)/, 'border-bottom:none;');
        listHtml += `</div></div>`;
    });
    
    list.innerHTML = listHtml; 

    // 啟動類別清單專用的拖曳與自動滾動
    initCategoryDragAndDrop(list, t);
}

window.openCategoryActionMenu = function(type, parentCat, subIdx, subName) {
    triggerHaptic(10);
    document.getElementById("category-action-subtitle").innerText = `所屬主類別：[${parentCat}]\n子類別：${subName}`;
    const container = document.getElementById("category-action-container");
    
    container.innerHTML = `
        <button class="action-menu-btn" onclick="closeModal('category-action-modal'); openCatMoveModal('${escapeJS(type)}', '${escapeJS(parentCat)}', ${subIdx})">➡️ 搬移至其他主類別</button>
        <button class="action-menu-btn" onclick="closeModal('category-action-modal'); openCatMergeModal('${escapeJS(type)}', '${escapeJS(parentCat)}', ${subIdx})">🔄 合併至其他子類別</button>
        <button class="action-menu-btn danger" onclick="closeModal('category-action-modal'); catDelete('${escapeJS(type)}', '${escapeJS(parentCat)}', ${subIdx})">🗑️ 刪除該類別</button>
    `;
    document.getElementById("category-action-modal").classList.add("active");
};

// 分類拖曳核心邏輯
window.initCategoryDragAndDrop = function(listEl, categoryType) {
    let draggedItem = null;
    let ghostItem = null;
    let placeholder = null;
    let startX = 0, startY = 0;
    let isMainDrag = false;
    
    let currentDragY = 0;
    let autoScrollInterval = null;

    const handleAutoScroll = () => {
        if (autoScrollInterval) return;
        autoScrollInterval = setInterval(() => {
            const rect = listEl.getBoundingClientRect();
            const threshold = 40;
            let step = 0;
            
            if (currentDragY - rect.top < threshold && currentDragY > rect.top - 20) step = -8;
            else if (rect.bottom - currentDragY < threshold && currentDragY < rect.bottom + 20) step = 8;

            if (step !== 0) {
                listEl.scrollTop += step;
            } else {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        }, 16);
    };

    const stopAutoScroll = () => {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    };

    const attachDrag = (items, handleClass, dragClass, isMain) => {
        Array.from(items).forEach(item => {
            const handle = item.querySelector(handleClass);
            if (!handle) return;
            
            const startDrag = (clientX, clientY) => {
                isMainDrag = isMain;
                draggedItem = item;

                // 取得元素原本的正確位置！
                const rect = item.getBoundingClientRect();

                placeholder = document.createElement('div');
                placeholder.style.height = `${item.offsetHeight}px`;
                placeholder.style.background = 'var(--slot-hover)';
                placeholder.style.borderRadius = '6px';
                placeholder.style.marginBottom = window.getComputedStyle(item).marginBottom;
                item.parentNode.insertBefore(placeholder, item);

                ghostItem = item.cloneNode(true);
                ghostItem.style.position = 'fixed';
                ghostItem.style.zIndex = '99999';
                ghostItem.style.width = `${item.offsetWidth}px`;
                ghostItem.style.margin = '0'; // 消除殘影的預設外距
                ghostItem.style.boxShadow = '0 10px 25px rgba(0,0,0,0.25)';
                ghostItem.style.opacity = '0.9';
                ghostItem.style.pointerEvents = 'none';
                ghostItem.style.transition = 'none';

                startX = clientX - rect.left;
                startY = clientY - rect.top;
                ghostItem.style.left = `${rect.left}px`;
                ghostItem.style.top = `${rect.top}px`;

                document.body.appendChild(ghostItem);
                item.style.display = 'none';
            };

            const moveDrag = (clientX, clientY) => {
                if (!draggedItem || !ghostItem) return;
                
                currentDragY = clientY;
                handleAutoScroll();
                
                ghostItem.style.left = `${clientX - startX}px`;
                ghostItem.style.top = `${clientY - startY}px`;

                const target = document.elementFromPoint(clientX, clientY);
                if (!target) return;
                
                const targetItem = target.closest(dragClass);
                
                if (targetItem && targetItem !== draggedItem && targetItem !== placeholder) {
                    // 如果拖曳子類別，不允許跨越不同的主類別方塊
                    if (!isMainDrag && targetItem.parentNode !== placeholder.parentNode) return;
                    
                    const rect = targetItem.getBoundingClientRect();
                    const isAfter = (clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    targetItem.parentNode.insertBefore(placeholder, isAfter ? targetItem.nextSibling : targetItem);
                }
            };

            const endDrag = () => {
                if (!draggedItem) return;
                stopAutoScroll();
                
                placeholder.parentNode.insertBefore(draggedItem, placeholder);
                draggedItem.style.display = isMainDrag ? 'block' : 'flex'; 
                
                if (ghostItem) ghostItem.remove();
                if (placeholder) placeholder.remove();
                
                const parentList = draggedItem.parentNode;
                
                // 依據是主類別還是子類別，儲存至對應的 state
                if (isMainDrag) {
                    const newMainOrder = Array.from(parentList.querySelectorAll('.draggable-cat-main')).map(c => c.dataset.main);
                    state.categoryOrder[categoryType] = newMainOrder;
                } else {
                    const mainName = parentList.dataset.main;
                    const newSubOrder = Array.from(parentList.querySelectorAll('.draggable-cat-sub')).map(c => c.dataset.sub);
                    getCategories()[categoryType][mainName] = newSubOrder;
                }
                
                draggedItem = null;
                ghostItem = null;
                placeholder = null;
                document.body.style.overflow = '';
                
                saveToStorage();
            };

            item.addEventListener('dragstart', (e) => e.preventDefault());
            
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startDrag(e.clientX, e.clientY);
                const onMouseMove = (ev) => moveDrag(ev.clientX, ev.clientY);
                const onMouseUp = () => {
                    endDrag();
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });

            handle.addEventListener('touchstart', (e) => {
                triggerHaptic(15);
                const touch = e.touches[0];
                startDrag(touch.clientX, touch.clientY);
                document.body.style.overflow = 'hidden';
            }, {passive: false});

            handle.addEventListener('touchmove', (e) => {
                if (!draggedItem) return;
                e.preventDefault();
                const touch = e.touches[0];
                moveDrag(touch.clientX, touch.clientY);
            }, {passive: false});

            handle.addEventListener('touchend', endDrag);
            handle.addEventListener('touchcancel', endDrag);
        });
    };

    attachDrag(listEl.querySelectorAll('.draggable-cat-main'), '.drag-handle-main', '.draggable-cat-main', true);
    attachDrag(listEl.querySelectorAll('.draggable-cat-sub'), '.drag-handle-sub', '.draggable-cat-sub', false);
};

function catMoveMain(t, i, d) { 
    const k = getCategoryKeys(t); 
    const ti = i + d; 
    if (ti < 0 || ti >= k.length) return; 
    
    const m = k[i]; 
    k.splice(i, 1); 
    k.splice(ti, 0, m); 
    
    state.categoryOrder[t] = k; 
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
}

function catMoveSub(t, p, i, d) { 
    const c = getCategories(); 
    const l = c[t][p]; 
    const ti = i + d; 
    if (ti < 0 || ti >= l.length) return; 
    
    const tmp = l[i]; 
    l[i] = l[ti]; 
    l[ti] = tmp; 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
}

function openAddMainCategoryModal() { 
    document.getElementById("cat-add-main-name").value = ""; 
    document.getElementById("cat-add-main-modal").classList.add("active"); 
}

function confirmAddMainCategory() { 
    const t = document.getElementById("cat-manage-type").value; 
    const n = `${document.getElementById("cat-add-main-icon").value} ${document.getElementById("cat-add-main-name").value.trim()}`; 
    const c = getCategories(); 
    
    if (!n.trim() || c[t][n]) return; 
    c[t][n] = ["一般項目"]; 
    
    if (!state.categoryOrder) state.categoryOrder = {}; 
    if (!state.categoryOrder[t]) state.categoryOrder[t] = Object.keys(c[t]); 
    if (!state.categoryOrder[t].includes(n)) state.categoryOrder[t].push(n); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    closeModal("cat-add-main-modal"); 
}

function openAddSubCategoryModal() { 
    const t = document.getElementById("cat-manage-type").value; 
    const sel = document.getElementById("cat-add-sub-parent"); 
    sel.innerHTML = ""; 
    
    getCategoryKeys(t).forEach(p => sel.appendChild(new Option(p,p))); 
    
    document.getElementById("cat-add-sub-name").value = ""; 
    document.getElementById("cat-add-sub-modal").classList.add("active"); 
}

function confirmAddSubCategory() { 
    const t = document.getElementById("cat-manage-type").value; 
    const p = document.getElementById("cat-add-sub-parent").value; 
    const n = document.getElementById("cat-add-sub-name").value.trim(); 
    const c = getCategories(); 
    
    if (!n || !c[t][p] || c[t][p].includes(n)) return; 
    c[t][p].push(n); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    closeModal("cat-add-sub-modal"); 
}

function openCatMoveModal(t, p, i) { 
    activeCatTask = { t, p, i, s: getCategories()[t][p][i] }; 
    const sel = document.getElementById("cat-move-select"); 
    sel.innerHTML = ""; 
    
    getCategoryKeys(t).filter(x => x !== p).forEach(x => sel.appendChild(new Option(x, x))); 
    document.getElementById("cat-move-modal").classList.add("active"); 
}

function confirmCatMove() { 
    const tp = document.getElementById("cat-move-select").value; 
    const { t, p, i, s } = activeCatTask; 
    const c = getCategories(); 
    
    (state.finances || []).forEach(f => { 
        if (f.type === t && f.parentCat === p && f.subCat === s) f.parentCat = tp; 
    }); 
    (state.recurringFinances || []).forEach(r => { 
        if (r.type === t && r.parentCat === p && r.subCat === s) r.parentCat = tp; 
    }); 
    
    c[t][p].splice(i, 1); 
    c[t][tp].push(s); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
    closeModal("cat-move-modal"); 
}

function openCatMergeModal(t, p, i) { 
    activeCatTask = { t, p, i, s: getCategories()[t][p][i] }; 
    const sel = document.getElementById("cat-merge-select"); 
    sel.innerHTML = ""; 
    
    getCategories()[t][p].filter((_, x) => x !== i).forEach(x => sel.appendChild(new Option(x, x))); 
    document.getElementById("cat-merge-modal").classList.add("active"); 
}

function confirmCatMerge() { 
    const ts = document.getElementById("cat-merge-select").value; 
    const { t, p, i, s } = activeCatTask; 
    const c = getCategories(); 
    
    state.finances.forEach(f => { 
        if (f.parentCat === p && f.subCat === s) f.subCat = ts; 
    }); 
    (state.recurringFinances || []).forEach(r => { 
        if (r.parentCat === p && r.subCat === s) r.subCat = ts; 
    }); 
    
    c[t][p].splice(i, 1); 
    
    saveToStorage(); 
    renderCategoryManageList(); 
    renderFinances(); 
    closeModal("cat-merge-modal"); 
}

function catDelete(t, p, i) { 
    showConfirm("確定刪除此子類別？", () => { 
        getCategories()[t][p].splice(i, 1); 
        saveToStorage(); 
        renderCategoryManageList(); 
        renderFinances(); 
    }); 
}

// ========================================================
// 好友互動與通知、便利貼 (其他補充函式)
// ========================================================

async function viewFriendSchedule(fId, fName) {
    try {
        const { data, error } = await supabaseClient.from("user_schedules").select("data").eq("user_id", fId).maybeSingle();
        
        if (error) {
            throw error;
        }

        if (data && data.data) {
            isViewingFriend = true; 
            viewingFriendId = fId; 
            friendState = data.data; 
            showIntersection = false;
            
            // 隱藏右下角加號按鈕
            const scheduleFab = document.getElementById("schedule-fab-container");
            if (scheduleFab) scheduleFab.style.display = "none";
            
            // 發送偷窺通知
            if (currentUser && fId !== currentUser.id) {
                supabaseClient.from('user_messages').insert({ sender_id: currentUser.id, receiver_id: fId, type: 'peek', payload: {} }).then(() => {}).catch((e)=>{ console.error("Peek event error", e); });
            }

            // 取得對方偷窺我的次數
            if (!state.peekCounts) state.peekCounts = {};
            const todayStr = formatDate(new Date());
            let peekRecord = state.peekCounts[fId];
            let peekCount = 0;
            
            if (peekRecord) {
                // 如果是舊版(純數字)資料，或是日期不是今天，就立刻歸零並存檔
                if (typeof peekRecord !== 'object' || peekRecord.date !== todayStr) {
                    state.peekCounts[fId] = { count: 0, date: todayStr };
                    saveToStorage(); // 發現不是今天就存檔覆寫
                    peekCount = 0;
                } else {
                    peekCount = peekRecord.count;
                }
            }

            // 加入元素存在檢查，並在文案加上「今日」
            const titleEl = document.getElementById("friend-view-title");
            if (titleEl) titleEl.innerText = `今日 ${fName} 偷窺了你 ${peekCount} 次`;
            
            const bannerEl = document.getElementById("friend-view-banner");
            if (bannerEl) bannerEl.style.display = "flex";
            
            // 重置空堂按鈕狀態
            const btn = document.getElementById("btn-toggle-intersection");
            if(btn) {
                btn.innerText = "□空堂";
                btn.style.background = "rgba(255,255,255,0.2)";
            }
            
            switchView('schedule'); 
            renderSchedule();
        } else { 
            showToast("無法取得該好友課表，可能對方尚未建立或設定權限。", "error"); 
        }
    } catch (e) { 
        console.error(e); 
        showToast("網路錯誤，無法取得好友資料", "error"); 
    }
}
function exitFriendView() { 
    isViewingFriend = false; 
    viewingFriendId = null; 
    friendState = null; 
    showIntersection = false; 
    
    document.getElementById("friend-view-banner").style.display = "none"; 
    
    // 恢復右下角加號按鈕
    const scheduleFab = document.getElementById("schedule-fab-container");
    if (scheduleFab) scheduleFab.style.display = "flex";
    
    renderSchedule(); 
}

window.toggleIntersectionBtn = function() {
    showIntersection = !showIntersection;
    const btn = document.getElementById("btn-toggle-intersection");
    if (showIntersection) {
        btn.innerText = "☑空堂";
        btn.style.background = "rgba(255,255,255,0.4)";
    } else {
        btn.innerText = "□空堂";
        btn.style.background = "rgba(255,255,255,0.2)";
    }
    renderSchedule();
};

window.deleteStickyNote = function() {
    if (!currentReadingNoteId) return;
    deleteMessage(currentReadingNoteId);
};

function toggleIntersection() { 
    showIntersection = document.getElementById("chk-intersection").checked; 
    renderSchedule(); 
}

// 課表空閒比對邏輯
function isMyTimeFree(day, startMins, endMins, dateStr) {
    const s = state.schedules.find(x => x.id === state.activeScheduleId) || state.schedules[0]; 
    if (!s) return true;

    // 【進階修復】找出在 dateStr 這天「被調走」的課程與事件，這些時段應該要算成空堂！
    const overriddenKeys = new Set();
    const overriddenIds = new Set();
    if (dateStr) {
        (s.overrides || []).forEach(o => {
            const sd = o.sourceDate || o.targetDate; // 兼容舊資料
            if (sd === dateStr) {
                if (o.type === 'school') overriddenKeys.add(o.sourceKey);
                else overriddenIds.add(o.sourceId);
            }
        });
    }

    // 共用跨日重疊檢測邏輯
    const checkOverlap = (itemDay, sm, em) => {
        if (sm > em) { // 發生跨日
            if (Number(itemDay) === day && sm < endMins && 1440 > startMins) return false;
            let nextDay = Number(itemDay) === 7 ? 1 : Number(itemDay) + 1;
            if (nextDay === day && 0 < endMins && em > startMins) return false;
        } else {
            if (Number(itemDay) === day && sm < endMins && em > startMins) return false;
        }
        return true;
    };

    // 1. 檢查一般節次課程 (排除被調走的課)
    for (let p of (s.periods || initialDefaultPeriods)) { 
        const key = `${day}_${p.id}`;
        if (overriddenKeys.has(key)) continue; // 這節課被調走了，所以算空堂
        
        const c = (s.courses || {})[key]; 
        if (c && c.name && timeToMinutes(p.start) < endMins && timeToMinutes(p.end) > startMins) return false; 
    }
    
    // 2. 檢查自訂課程、家教、工作 (排除被調走的項目)
    for (let c of (s.customCourses || [])) { 
        if (overriddenKeys.has(`${c.day}_${c.id}`)) continue;
        if (!checkOverlap(c.day, timeToMinutes(c.startTime), timeToMinutes(c.endTime))) return false; 
    }
    for (let t of (s.tutorings || [])) { 
        if (overriddenIds.has(t.id)) continue;
        if (!checkOverlap(t.day, timeToMinutes(t.startTime), timeToMinutes(t.endTime))) return false; 
    }
    for (let w of (s.works || [])) { 
        if (overriddenIds.has(w.id)) continue;
        if (!checkOverlap(w.day, timeToMinutes(w.startTime), timeToMinutes(w.endTime))) return false; 
    }
    
    // 3. 檢查臨時事件
    for (let t of (s.temporaryEvents || [])) { 
        let st = t.startTime, et = t.endTime; 
        if (t.slotType === 'noon') { 
            st = "12:00"; 
            et = "13:00"; 
        } else if (t.slotType === 'period') { 
            const spObj = (s.periods || initialDefaultPeriods).find(p => String(p.id) === String(t.periodId)); 
            if (spObj) { 
                st = spObj.start; 
                et = spObj.end; 
            } 
        } 
        if (!checkOverlap(t.day, timeToMinutes(st), timeToMinutes(et))) return false; 
    }

    // 4. 檢查調課 (Overrides) - 判斷移入這天的事件
    if (dateStr) {
        for (let o of (s.overrides || [])) {
            let sm = timeToMinutes(o.startTime), em = timeToMinutes(o.endTime);
            if (o.targetDate === dateStr) { 
                if (sm > em) {
                    if (sm < endMins && 1440 > startMins) return false;
                } else {
                    if (sm < endMins && em > startMins) return false;
                }
            } else if (sm > em) {
                const prevDateObj = new Date(dateStr);
                prevDateObj.setDate(prevDateObj.getDate() - 1);
                if (o.targetDate === formatDate(prevDateObj) && 0 < endMins && em > startMins) return false;
            }
        }
    }
    return true;
}

function openPrivacyMaskModal() {
    const sch = getActiveSchedule(); 
    const listEl = document.getElementById('privacy-mask-list'); 
    listEl.innerHTML = '';
    
    const dayNames = ["", "週一", "週二", "週三", "週四", "週五", "週六", "週日"];
    let html = `<div style="font-weight:bold; margin-top:5px; color:var(--primary);">🏫 學校課程</div>`;
    
    Object.keys(sch.courses || {}).forEach(k => { 
        const c = sch.courses[k]; 
        if (c.name) {
            const [cDay, cPeriod] = k.split('_');
            const pObj = (sch.periods || initialDefaultPeriods).find(p => String(p.id) === cPeriod);
            const timeStr = pObj ? pObj.name : `第 ${cPeriod} 節`;
            html += `
                <div>
                    <label class="checkbox-label" style="display:flex; align-items:flex-start;">
                        <input type="checkbox" style="margin-top:2px;" id="mask_sch_${k}" ${c.isMasked ? 'checked' : ''}> 
                        <span>[${dayNames[cDay]} ${timeStr}]<br>${escapeHtml(c.name)}</span>
                    </label>
                </div>`; 
        }
    });
    
    (sch.customCourses || []).forEach(c => { 
        if (c.name) {
            html += `
                <div>
                    <label class="checkbox-label" style="display:flex; align-items:flex-start;">
                        <input type="checkbox" style="margin-top:2px;" id="mask_custom_${c.id}" ${c.isMasked ? 'checked' : ''}> 
                        <span>[${dayNames[c.day]} ${c.startTime}~${c.endTime}]<br>${escapeHtml(c.name)} (自訂)</span>
                    </label>
                </div>`; 
        }
    });
    
    html += `<div style="font-weight:bold; margin-top:10px; color:var(--primary);">📖 家教課程</div>`;
    (sch.tutorings || []).forEach(t => { 
        html += `
            <div>
                <label class="checkbox-label" style="display:flex; align-items:flex-start;">
                    <input type="checkbox" style="margin-top:2px;" id="mask_tut_${t.id}" ${t.isMasked ? 'checked' : ''}> 
                    <span>[${dayNames[t.day]} ${t.startTime}~${t.endTime}]<br>${escapeHtml(t.student)}</span>
                </label>
            </div>`; 
    });
    
    html += `<div style="font-weight:bold; margin-top:10px; color:var(--primary);">💼 工作排程</div>`;
    (sch.works || []).forEach(w => { 
        html += `
            <div>
                <label class="checkbox-label" style="display:flex; align-items:flex-start;">
                    <input type="checkbox" style="margin-top:2px;" id="mask_work_${w.id}" ${w.isMasked ? 'checked' : ''}> 
                    <span>[${dayNames[w.day]} ${w.startTime}~${w.endTime}]<br>${escapeHtml(w.name)}</span>
                </label>
            </div>`; 
    });
    
    listEl.innerHTML = html; 
    document.getElementById('privacy-mask-modal').classList.add('active');
}

function savePrivacyMask() {
    const sch = getActiveSchedule();
    Object.keys(sch.courses || {}).forEach(k => { 
        const el = document.getElementById(`mask_sch_${k}`); 
        if (el) sch.courses[k].isMasked = el.checked; 
    });
    (sch.customCourses || []).forEach(c => { 
        const el = document.getElementById(`mask_custom_${c.id}`); 
        if (el) c.isMasked = el.checked; 
    });
    (sch.tutorings || []).forEach(t => { 
        const el = document.getElementById(`mask_tut_${t.id}`); 
        if (el) t.isMasked = el.checked; 
    });
    (sch.works || []).forEach(w => { 
        const el = document.getElementById(`mask_work_${w.id}`); 
        if (el) w.isMasked = el.checked; 
    });
    
    saveToStorage(); 
    renderSchedule(); 
    closeModal('privacy-mask-modal'); 
    showToast('隱私遮罩設定已儲存！');
}

function openLeaveNoteModal(day, timeKey) { 
    if (!isViewingFriend) return; 
    document.getElementById("note-target-key").value = day || ""; 
    document.getElementById("note-target-time").value = timeKey || ""; 
    document.getElementById("note-content").value = ""; 
    document.getElementById("leave-note-modal").classList.add("active"); 
}

async function sendStickyNote() {
    const cnt = document.getElementById("note-content").value.trim(); 
    if (!cnt) return;
    
    try {
        await supabaseClient.from('user_messages').insert({ 
            sender_id: currentUser.id, 
            receiver_id: viewingFriendId, 
            type: 'note', 
            payload: { day: document.getElementById("note-target-key").value, timeKey: document.getElementById("note-target-time").value, content: cnt } 
        });
        
        closeModal('leave-note-modal'); 
        await fetchMessages(); 
        renderSchedule(); 
        showToast("留言已貼上！對方將收到通知。");
    } catch (e) { 
        console.error(e); 
        showToast("發送留言失敗", "error"); 
    }
}

function readStickyNote(msgId) {
    const m = userMessages.find(x => x.id === msgId); 
    if (!m) return; 
    
    currentReadingNoteId = msgId;
    const ctxStr = getNoteContextStr(m.payload.day, m.payload.timeKey);
    
    document.getElementById("read-note-content").innerHTML = `
        <div style="font-size:0.8rem; color:#b45309; margin-bottom:8px; border-bottom:1px dashed #d97706; padding-bottom:6px;">
            📍 位於：${escapeHtml(ctxStr)}
        </div>
        <div style="font-size:0.9rem; line-height:1.5;">${escapeHtmlWithBr(m.payload.content)}</div>
    `;
    
    document.getElementById("read-note-modal").classList.add("active");
    
    if (m.status === 'unread') {
        markNoteRead(msgId); 
    }
}

function getNoteBadgeHtml(day, timeKey) {
    const targetId = isViewingFriend ? viewingFriendId : currentUser?.id; 
    if (!targetId || !currentUser) return "";
    
    let notes = userMessages.filter(m => m.type === 'note' && m.payload.day == String(day) && m.payload.timeKey == String(timeKey));
    
    if (isViewingFriend) {
        notes = notes.filter(m => String(m.sender_id) === String(currentUser.id) && String(m.receiver_id) === String(viewingFriendId));
    } else {
        notes = notes.filter(m => String(m.receiver_id) === String(currentUser.id));
    }
    
    if (notes.length > 0) {
        const unreadCount = notes.filter(m => m.status === 'unread').length;
        const txt = isViewingFriend ? "💬已留言" : (unreadCount > 0 ? `💬新留言(${unreadCount})` : "💬留言紀錄");
        const bg = (unreadCount > 0 || isViewingFriend) ? "#ef4444" : "#64748b";
        
        return `<button class="memo-badge" style="border:none; background:${bg}; color:white; cursor:pointer; font-size:0.55rem; font-weight:bold; top:1px; right:1px; z-index:30; padding:1px 3px; border-radius:3px; position:absolute; pointer-events:auto; white-space:nowrap; transform:scale(0.8); transform-origin:top right;" onmousedown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="event.stopPropagation(); readStickyNote('${notes[0].id}')">${txt}</button>`;
    } 
    return "";
}

// 關閉 Modal 與背景點擊偵測
function closeModal(id) { 
    const modal = document.getElementById(id); 
    if (modal) modal.classList.remove("active"); 
}

window.addEventListener('click', function(event) { 
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id); 
    }
});
// ========================================================
// 學分計算機 (Credit Calculator) 全新進階版
// ========================================================

window.currentCreditSemester = null;
window.tempNewSem = { year: '大一', term: '上' };
window.editingScoreId = null;

const DEFAULT_GRADE_SCALE = [
    { min: 90, max: 100, grade: 'A+', gpa: 4.3 },
    { min: 85, max: 89, grade: 'A', gpa: 4.0 },
    { min: 80, max: 84, grade: 'A-', gpa: 3.7 },
    { min: 77, max: 79, grade: 'B+', gpa: 3.3 },
    { min: 73, max: 76, grade: 'B', gpa: 3.0 },
    { min: 70, max: 72, grade: 'B-', gpa: 2.7 },
    { min: 67, max: 69, grade: 'C+', gpa: 2.3 },
    { min: 63, max: 66, grade: 'C', gpa: 2.0 },
    { min: 60, max: 62, grade: 'C-', gpa: 1.7 },
    { min: 0, max: 59, grade: 'D', gpa: 0.0 }
];

window.ensureCreditState = function() {
    let needsSave = false; // 追蹤是否進行了結構升級
    
    if (!state.credits) { 
        state.credits = {}; 
        needsSave = true; 
    }
    
    if (!state.credits.semesterOrder) { 
        state.credits.semesterOrder = ["大一上", "大一下", "大二上", "大二下", "大三上", "大三下", "大四上", "大四下"]; 
        needsSave = true; 
    }
    
    if (!state.credits.semesters) { 
        state.credits.semesters = { 
            "大一上": [], "大一下": [], "大二上": [], "大二下": [], 
            "大三上": [], "大三下": [], "大四上": [], "大四下": [] 
        }; 
        needsSave = true; 
    }
    
    if (!state.credits.gradeScale) { 
        state.credits.gradeScale = structuredClone(DEFAULT_GRADE_SCALE); 
        needsSave = true; 
    }
    
    // 初始化領域，預設全為 0
    if (!state.credits.domains) {
        let oldTargets = state.credits.targets || {};
        state.credits.domains = [
            { name: "系必修", target: oldTargets["系必修"] || 0, isMajor: true, canDelete: false },
            { name: "系選修", target: oldTargets["系選修"] || 0, isMajor: true, canDelete: true },
            { name: "通識", target: oldTargets["通識"] || 0, isMajor: false, canDelete: true },
            { name: "共同必修", target: oldTargets["共同必修"] || 0, isMajor: false, canDelete: true },
            { name: "自由選修", target: oldTargets["自由選修"] || 0, isMajor: false, canDelete: true }
        ];
        needsSave = true;
    }

    // 強制動態更新總目標學分為「所有領域的加總」
    if (state.credits.domains) {
        const dynamicTotal = state.credits.domains.reduce((sum, d) => sum + (Number(d.target) || 0), 0);
        if (state.credits.targetTotal !== dynamicTotal) {
            state.credits.targetTotal = dynamicTotal;
            needsSave = true;
        }
    }

    if (needsSave) {
        saveToStorage();
    }
};

window.openCreditCalculator = function() {
    triggerHaptic(15);
    window.ensureCreditState();
    
    if (!window.currentCreditSemester && state.credits.semesterOrder.length > 0) {
        window.currentCreditSemester = state.credits.semesterOrder[0];
    }
    
    // 1. 先把 Modal 打開，讓容器具備實際寬度
    document.getElementById("credit-calculator-modal").classList.add("active");
    
    // 2. 微小延遲確保 CSS 渲染完畢後，再畫折線圖
    setTimeout(() => {
        renderCreditCalculator();
    }, 10);
};

// ================= 學期切換相關 =================
window.openSemesterSwitchModal = function() {
    triggerHaptic(10);
    const listEl = document.getElementById("semester-switch-list");
    listEl.innerHTML = state.credits.semesterOrder.map(s => `
        <div class="sem-switch-item" style="${s === window.currentCreditSemester ? 'color: var(--primary); background: var(--slot-hover);' : ''}" 
             onclick="changeCreditSemester('${escapeJS(s)}')">${escapeHtml(s)}</div>
    `).join('');
    document.getElementById("semester-switch-modal").classList.add("active");
};

window.changeCreditSemester = function(sem) {
    window.currentCreditSemester = sem;
    closeModal("semester-switch-modal");
    renderCreditCalculator();
};

// ================= 主畫面渲染與演算法 =================
window.renderCreditCalculator = function() {
    const body = document.getElementById("credit-calculator-body");
    const data = state.credits;
    
    document.getElementById("credit-sem-title").innerText = window.currentCreditSemester || "無學期";

    let currentTotal = 0; // 圓餅圖總進度
    let domainTotals = {};
    data.domains.forEach(d => domainTotals[d.name] = 0);

    let totalScoreSum = 0, totalCredSum = 0;
    let majorScoreSum = 0, majorCredSum = 0;
    let hundredScoreSum = 0, hundredCredSum = 0; 
    let majorHundredScoreSum = 0, majorHundredCredSum = 0;
    let semesterTrends = [];

    let gradeCredits = {};
    let totalGradedCredits = 0;

    const majorDomains = data.domains.filter(d => d.isMajor).map(d => d.name);

    // 第一階段：計算各領域實際取得的總學分，與成績加權
    data.semesterOrder.forEach(sem => {
        let semScoreSum = 0, semCredSum = 0;
        
        (data.semesters[sem] || []).forEach(c => {
            const cr = parseFloat(c.credits) || 0;
            const scStr = String(c.score || '').trim();
            const sc = parseFloat(scStr);
            const gpa = parseFloat(c.gpa);
            
            // 嚴格判斷是否取得學分：
            let isEarned = false;
            if (c.score === "抵免" || c.score === "通過") {
                isEarned = true; // 抵免、通過：取得學分
            } else if (c.score === "免修") {
                isEarned = false; // 免修：嚴格不取得學分
            } else if (!isNaN(sc)) {
                isEarned = sc >= 60;
            } else if (c.gpa && parseFloat(c.gpa) > 0) {
                isEarned = true;
            } else if (isNaN(sc) && !c.gpa && cr > 0 && scStr === "") {
                isEarned = true;
            }

            if (isEarned) {
                if (domainTotals[c.category] !== undefined) domainTotals[c.category] += cr;
            }

            // 不計入分數與 GPA 的判斷 (抵免、通過、免修 皆排除)
            if (!["抵免", "通過", "免修"].includes(c.score)) {
                if (!isNaN(gpa) && cr > 0) {
                    const weighted = gpa * cr;
                    semScoreSum += weighted; 
                    semCredSum += cr;
                    totalScoreSum += weighted; 
                    totalCredSum += cr;
                    
                    if (majorDomains.includes(c.category)) {
                        majorScoreSum += weighted; 
                        majorCredSum += cr;
                    }
                }
                if (!isNaN(sc) && cr > 0) {
                    const wHundred = sc * cr;
                    hundredScoreSum += wHundred; 
                    hundredCredSum += cr;
                    
                    if (majorDomains.includes(c.category)) {
                        majorHundredScoreSum += wHundred; 
                        majorHundredCredSum += cr;
                    }
                }
            }

            if (c.grade && cr > 0 && c.grade !== "-") {
                if (!gradeCredits[c.grade]) gradeCredits[c.grade] = 0;
                gradeCredits[c.grade] += cr;
                totalGradedCredits += cr;
            }
        });
        
        if (semCredSum > 0) {
            semesterTrends.push({ name: sem, avgScore: (semScoreSum / semCredSum).toFixed(2) });
        }
    });

    // 計算圓餅圖的有效進度 currentTotal
    data.domains.forEach(d => {
        const tgt = Number(d.target) || 0;
        const cur = domainTotals[d.name] || 0;
        // 只算有目標學分的，且超過目標學分的不記錄在內
        if (tgt > 0) {
            currentTotal += Math.min(cur, tgt);
        }
    });

    const totalPct = data.targetTotal > 0 ? Math.min(100, (currentTotal / data.targetTotal) * 100).toFixed(0) : 0;
    const overallGpa = totalCredSum > 0 ? (totalScoreSum / totalCredSum).toFixed(2) : "—";
    const majorGpa = majorCredSum > 0 ? (majorScoreSum / majorCredSum).toFixed(2) : "—";
    const overallAvg = hundredCredSum > 0 ? (hundredScoreSum / hundredCredSum).toFixed(1) : "—";
    const majorAvg = majorHundredCredSum > 0 ? (majorHundredScoreSum / majorHundredCredSum).toFixed(1) : "—";

    let html = `
        <div class="credit-top-card">
            <div class="circular-progress-wrap" style="background: conic-gradient(var(--primary) ${totalPct}%, var(--border) 0);">
                <div class="circular-progress-inner"><span>${currentTotal}</span><small>/ ${data.targetTotal}</small></div>
            </div>
            <div class="credit-stats-info">
                <h4>畢業進度 ${totalPct}% · 還差 ${Math.max(0, data.targetTotal - currentTotal)} 學分</h4>
                <div class="gpa-grid">
                    <div>
                        <div class="gpa-label">整體績點</div>
                        <div class="gpa-value">${overallGpa} <span class="gpa-max">/ 4.3</span></div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">平均 ${overallAvg}</div>
                    </div>
                    <div>
                        <div class="gpa-label">主修績點</div>
                        <div class="gpa-value" style="color: var(--text);">${majorGpa} <span class="gpa-max">/ 4.3</span></div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">主修平均 ${majorAvg}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="domain-list-card">
    `;
    
    data.domains.forEach(d => {
        const tgt = d.target; 
        const cur = domainTotals[d.name] || 0;
        const pct = tgt > 0 ? Math.min(100, (cur / tgt) * 100) : 0;
        const barColor = cur >= tgt ? '#10b981' : 'var(--primary)';
        html += `
            <div class="domain-row">
                <div class="domain-name">${escapeHtml(d.name)}</div>
                <div class="domain-bar-bg">
                    <div class="domain-bar-fill" style="width: ${pct}%; background: ${barColor};"></div>
                </div>
                <div class="domain-val">${cur} / ${tgt}</div>
            </div>`;
    });
    
    html += `</div><div class="credit-chart-container" style="border:none; padding:0; background:transparent;">${getCreditTrendSVG(semesterTrends)}</div>`;

    if (totalGradedCredits > 0) {
        const standardOrder = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "E", "F", "X", "抵免", "通過", "免修"];
        const sortedGrades = Object.keys(gradeCredits).sort((a, b) => {
            let idxA = standardOrder.indexOf(a);
            let idxB = standardOrder.indexOf(b);
            if (idxA === -1) idxA = 99;
            if (idxB === -1) idxB = 99;
            return idxA - idxB;
        });

        html += `<div class="domain-list-card" style="margin-top: 0px; margin-bottom: 16px;">`;
        html += `<h4 style="font-size:0.8rem; text-align:center; margin-top:0; margin-bottom:12px; color:var(--text);">等第分佈 (依學分比例)</h4>`;

        sortedGrades.forEach((grade, index) => {
            const cr = gradeCredits[grade];
            const pct = (cr / totalGradedCredits) * 100;
            
            let barColor = "var(--primary)";
            if (["D", "E", "F", "X"].includes(grade)) barColor = "#ef4444";
            else if (["通過", "抵免", "免修"].includes(grade)) barColor = "#10b981";

            html += `
                <div style="display:flex; align-items:center; margin-bottom:${index === sortedGrades.length - 1 ? '0' : '8px'}; font-size:0.8rem;">
                    <div style="width: 40px; font-weight:700; color:var(--text);">${escapeHtml(grade)}</div>
                    <div style="flex:1; height:8px; background:var(--table-th-bg); border-radius:4px; margin:0 10px; overflow:hidden;">
                        <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:4px;"></div>
                    </div>
                    <div style="width: 45px; text-align:right; color:var(--text-muted); font-weight:600;">${pct.toFixed(1)}%</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    let sem = window.currentCreditSemester;
    if (sem) {
        const courses = data.semesters[sem] || [];
        
        let semEarnedCreds = 0; 
        let semGpaSum = 0, semGpaCreds = 0;
        let semScoreSum = 0, semScoreCreds = 0;

        courses.forEach(c => {
            const cr = parseFloat(c.credits) || 0;
            const scStr = String(c.score || '').trim();
            const sc = parseFloat(scStr);
            const gpa = parseFloat(c.gpa);

            let isEarned = false;
            if (c.score === "抵免" || c.score === "通過") {
                isEarned = true;
            } else if (c.score === "免修") {
                isEarned = false;
            } else if (!isNaN(sc)) {
                isEarned = sc >= 60;
            } else if (c.gpa && parseFloat(c.gpa) > 0) {
                isEarned = true;
            } else if (isNaN(sc) && !c.gpa && cr > 0 && scStr === "") {
                isEarned = true;
            }
            
            if (isEarned) {
                semEarnedCreds += cr;
            }

            if (!["抵免", "通過", "免修"].includes(c.score)) {
                if (!isNaN(gpa) && cr > 0) { 
                    semGpaSum += gpa * cr; 
                    semGpaCreds += cr; 
                }
                if (!isNaN(sc) && cr > 0) { 
                    semScoreSum += sc * cr; 
                    semScoreCreds += cr; 
                }
            }
        });

        const displayGpa = semGpaCreds > 0 ? (semGpaSum / semGpaCreds).toFixed(2) : "—";
        const displayAvg = semScoreCreds > 0 ? (semScoreSum / semScoreCreds).toFixed(1) : "—";

        html += `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin: 16px 0 8px 0;">
                <div>
                    <h4 style="font-size:1.05rem; margin:0 0 6px 0; color:var(--text); font-weight:bold;">${escapeHtml(sem)}</h4>
                    <div style="display:flex; gap:8px; font-size:0.75rem; color:var(--text-muted);">
                        <div style="background:var(--table-th-bg); padding:2px 6px; border-radius:6px; border:1px solid var(--border);">已得學分 <span style="color:var(--text); font-weight:bold;">${semEarnedCreds}</span></div>
                        <div style="background:var(--table-th-bg); padding:2px 6px; border-radius:6px; border:1px solid var(--border);">績點 <span style="color:var(--primary); font-weight:bold;">${displayGpa}</span></div>
                        <div style="background:var(--table-th-bg); padding:2px 6px; border-radius:6px; border:1px solid var(--border);">平均 <span style="color:var(--primary); font-weight:bold;">${displayAvg}</span></div>
                    </div>
                </div>
                <div>
                    <button style="padding:4px 10px; border-radius:12px; font-size:0.75rem; background:transparent; color:var(--primary); border:1px solid var(--primary); cursor:pointer; font-weight:bold; outline:none;" onclick="openImportScheduleModal('${escapeJS(sem)}')">匯入課表</button>
                </div>
            </div>
        `;
        
        if (courses.length === 0) {
            html += `
                <div class="credit-table-container">
                    <div style="text-align:center; padding: 20px; cursor: pointer; color:var(--text-muted);" onclick="addCreditCourse('${escapeJS(sem)}')">
                        <span style="font-size:0.85rem; font-weight:bold;">＋ 新增第一門科目</span>
                    </div>
                </div>
            `;
        } else {
            html += `<div class="credit-table-container">`;
            html += `
                <div class="credit-table-header">
                    <div class="credit-cell" style="flex:2.5; justify-content: flex-start; padding-left:10px;">科目名稱</div>
                    <div class="credit-cell" style="flex:1;">學分</div>
                    <div class="credit-cell" style="flex:1.2;">成績</div>
                    <div class="credit-cell" style="flex:1;">等第</div>
                    <div class="credit-cell" style="flex:1.8;">類別</div>
                </div>
            `;
            
            courses.forEach(c => {
                let catOptions = data.domains.map(d => `<option value="${escapeHtml(d.name)}" ${c.category === d.name ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('');
                let gradeDisplay = c.grade ? `${c.grade}<br><small>${c.gpa || ''}</small>` : "-";
                
                let scoreColor = "";
                let scoreText = c.score || '-';
                if (!isNaN(parseFloat(c.score)) && parseFloat(c.score) < 60) {
                    scoreColor = "color: #ef4444; border-color: #ef4444;";
                }
                
                let gradeColor = "";
                if (c.grade && ["D", "E", "F"].includes(c.grade)) {
                    gradeColor = "color: #ef4444;";
                }
                
                if (["抵免", "通過", "免修"].includes(c.score)) {
                    scoreText = c.score; 
                    gradeDisplay = "-<br><small>-</small>"; 
                }

                html += `
                    <div class="swipe-container">
                        <button class="swipe-delete-btn" onclick="deleteCreditCourse('${escapeJS(sem)}', '${c.id}')">刪除</button>
                        <div class="swipe-content" id="swipe_${c.id}" 
                             onmousedown="handleSwipeStart(event, this)" 
                             onmousemove="handleSwipeMove(event, this)" 
                             onmouseup="handleSwipeEnd(event, this, '${escapeJS(sem)}', '${c.id}')" 
                             onmouseleave="handleSwipeEnd(event, this, '${escapeJS(sem)}', '${c.id}')"
                             ontouchstart="handleSwipeStart(event, this)" 
                             ontouchmove="handleSwipeMove(event, this)" 
                             ontouchend="handleSwipeEnd(event, this, '${escapeJS(sem)}', '${c.id}')">
                             
                            <div class="credit-cell" style="flex:2.5; justify-content: flex-start; padding-left:10px;">
                                <input type="text" class="clean-input left" placeholder="科目名稱" value="${escapeHtml(c.name)}" oninput="updateCreditCourse('${escapeJS(sem)}', '${c.id}', 'name', this.value, false)">
                            </div>
                            <div class="credit-cell" style="flex:1;">
                                <input type="number" class="clean-input" value="${c.credits}" oninput="updateCreditCourse('${escapeJS(sem)}', '${c.id}', 'credits', this.value, false)" onblur="renderCreditCalculator()">
                            </div>
                            <div class="credit-cell" style="flex:1.2;">
                                <div class="score-btn" style="${scoreColor}" onclick="openScoreModal('${escapeJS(sem)}', '${c.id}', '${c.score || ''}')">${scoreText}</div>
                            </div>
                            <div class="credit-cell" style="flex:1;">
                                <div class="grade-info" style="${gradeColor}">${gradeDisplay}</div>
                            </div>
                            <div class="credit-cell" style="flex:1.8;">
                                <select class="cat-badge" onchange="updateCreditCourse('${escapeJS(sem)}', '${c.id}', 'category', this.value)">${catOptions}</select>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `
                <div style="text-align:center; padding: 12px; background: var(--card-bg); cursor: pointer;" onclick="addCreditCourse('${escapeJS(sem)}')">
                    <span style="color:var(--text-muted); font-size:0.85rem; font-weight:bold;">＋ 新增科目</span>
                </div>
            </div>`; 
        }
        html += `
            <div style="text-align:center; margin-top:20px;">
                <button class="btn btn-secondary" style="font-size:0.75rem; background:transparent; color:#ef4444; border:1px dashed #ef4444;" onclick="deleteCreditSemester('${escapeJS(sem)}')">刪除此學期紀錄</button>
            </div>
        `;
    }

    body.innerHTML = html;
};

// ================= 左滑觸發刪除邏輯 =================
let swipeStartX = 0;
let isSwiping = false;

window.handleSwipeStart = function(e, el) { 
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select' || e.target.classList.contains('score-btn')) return;
    
    isSwiping = true;
    swipeStartX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; 
    el.style.transition = 'none'; 
};

window.handleSwipeMove = function(e, el) {
    if (!isSwiping || !swipeStartX) return;
    
    let currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    let diff = swipeStartX - currentX;
    
    // 視覺跟隨 (只給予微幅移動手感)
    if (diff > 0 && diff <= 100) { 
        el.style.transform = `translateX(-${diff}px)`;
    }
};

window.handleSwipeEnd = function(e, el, sem, id) {
    if (!isSwiping || !swipeStartX) return;
    isSwiping = false;
    
    let currentX = e.type.includes('mouse') ? e.clientX : (e.changedTouches ? e.changedTouches[0].clientX : swipeStartX);
    let diff = swipeStartX - currentX;
    
    // 放手時一律彈回原位
    el.style.transition = 'transform 0.3s ease-out'; 
    el.style.transform = `translateX(0)`; 
    
    // 如果滑動距離夠大，彈出刪除確認
    if (diff > 70) { 
        setTimeout(() => {
            deleteCreditCourse(sem, id);
        }, 100);
    }
    swipeStartX = 0;
};

window.resetAllSwipes = function() {
    document.querySelectorAll('.swipe-content').forEach(el => el.style.transform = `translateX(0)`);
};

// ================= 成績點擊底部 Modal =================

window.currentSpecialScore = null;

window.openScoreModal = function(sem, id, currentScore) {
    triggerHaptic(10);
    window.editingScoreId = { sem, id };
    const course = state.credits.semesters[sem].find(c => c.id === id);
    
    document.getElementById("score-modal-subtitle").innerText = `${course.name || '未命名科目'} · ${course.credits} 學分`;
    
    // 初始化狀態：分離特殊分數與純數字顯示
    window.currentSpecialScore = null;
    
    if (["抵免", "通過", "免修"].includes(currentScore)) {
        window.currentSpecialScore = currentScore;
        document.getElementById("score-modal-input").value = "";
        document.getElementById("score-no-gpa-check").checked = true;
    } else {
        document.getElementById("score-modal-input").value = currentScore === '-' ? '' : currentScore;
        document.getElementById("score-no-gpa-check").checked = false;
    }
    
    window.toggleSpecialScoreBtns();
    window.updateSpecialScoreUI();
    document.getElementById("score-input-modal").classList.add("active");
};

window.toggleSpecialScoreBtns = function() {
    const isChecked = document.getElementById("score-no-gpa-check").checked;
    document.getElementById("special-score-btns").style.display = isChecked ? "flex" : "none";
    if (!isChecked) window.currentSpecialScore = null;
    window.updateSpecialScoreUI();
};

window.setSpecialScore = function(val) {
    if (window.currentSpecialScore === val) {
        window.currentSpecialScore = null;
    } else {
        window.currentSpecialScore = val;
        document.getElementById("score-modal-input").value = ""; // 點選按鈕時清空數字
    }
    window.updateSpecialScoreUI();
};

window.updateSpecialScoreUI = function() {
    document.querySelectorAll("#special-score-btns .btn").forEach(btn => {
        if (btn.innerText === window.currentSpecialScore) {
            btn.classList.add("active");
            btn.classList.remove("btn-secondary");
        } else {
            btn.classList.remove("active");
            btn.classList.add("btn-secondary");
        }
    });
};

window.openScoreInfoModal = function() {
    document.getElementById("score-info-modal").classList.add("active");
};

window.saveScoreModal = function() {
    let val = document.getElementById("score-modal-input").value.trim();
    const { sem, id } = window.editingScoreId;
    
    // 如果勾選了不計績點且有選擇特殊燈號，優先使用該數值
    if (document.getElementById("score-no-gpa-check").checked && window.currentSpecialScore) {
        val = window.currentSpecialScore;
    } else if (val !== "") {
        // 限定成績必須在 0~100 之間
        const scoreNum = parseFloat(val);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
            showToast("請輸入 0~100 之間的有效數字", "error");
            return;
        }
    }
    
    const course = state.credits.semesters[sem].find(c => c.id === id);
    if (!course) return;

    course.score = val;
    const scoreNum = parseFloat(val);

    if (!isNaN(scoreNum)) {
        const scale = state.credits.gradeScale.find(s => scoreNum >= s.min && scoreNum <= s.max);
        if (scale) {
            course.grade = scale.grade;
            course.gpa = scale.gpa;
        }
    } else if (["抵免", "通過", "免修"].includes(val)) {
        course.grade = val; 
        course.gpa = "";    
    } else {
        course.grade = "";
        course.gpa = "";
    }

    saveToStorage();
    closeModal("score-input-modal");
    renderCreditCalculator();
};

window.updateCreditCourse = function(sem, id, field, value, shouldRender = true) {
    const course = state.credits.semesters[sem].find(c => c.id === id);
    if (course) {
        course[field] = value;
        saveToStorage();
        // 把原本的判斷改掉，讓文字跟數字輸入時只在背後存檔，不馬上重繪畫面
        if (shouldRender && field === 'category') renderCreditCalculator();
    }
};

// ================= SVG 折線圖 =================
function getCreditTrendSVG(semesters) {
    if (semesters.length === 0) {
        return `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding: 30px 0;">尚未產生趨勢，請新增成績</div>`;
    }
    
    const maxScore = 4.3;
    const minScore = Math.max(Math.min(...semesters.map(s => parseFloat(s.avgScore))) - 0.5, 0); 
    const width = document.getElementById('credit-calculator-modal').clientWidth - 40 || 300; 
    const height = 140; 
    const padX = 30; 
    const padY = 25;
    const rangeX = width - padX * 2; 
    const rangeY = height - padY * 2;
    
    const getX = (idx) => {
        if (semesters.length === 1) return width / 2; // 單一學期置中
        return padX + (idx * (rangeX / (semesters.length - 1)));
    };
    
    const getY = (val) => height - padY - ((val - minScore) / (maxScore - minScore || 1)) * rangeY;
    
    let points = semesters.map((s, idx) => `${getX(idx)},${getY(s.avgScore)}`).join(" ");
    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible; display:block; margin:auto;">`;
    
    [4.0, 3.0, 2.0].forEach(val => {
        if (val >= minScore) {
            svg += `<line x1="${padX}" y1="${getY(val)}" x2="${width-padX}" y2="${getY(val)}" stroke="var(--border)" stroke-dasharray="4"/>`;
            svg += `<text x="${padX - 8}" y="${getY(val) + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">${val.toFixed(1)}</text>`;
        }
    });
    
    if (semesters.length > 1) {
        svg += `<polyline points="${points}" fill="none" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    
    semesters.forEach((s, idx) => {
        const x = getX(idx); 
        const y = getY(s.avgScore);
        svg += `<circle cx="${x}" cy="${y}" r="4" fill="var(--card-bg)" stroke="#a855f7" stroke-width="2"/>`;
        svg += `<text x="${x}" y="${y - 10}" fill="var(--text)" font-size="10" text-anchor="middle" font-weight="bold">${s.avgScore}</text>`;
        svg += `<text x="${x}" y="${height - 5}" fill="var(--text-muted)" font-size="10" text-anchor="middle">${escapeHtml(s.name.replace('學期',''))}</text>`;
    });
    
    svg += `</svg>`;
    return svg;
}

// ================= 學期與課程操作 =================
window.openAddSemesterModal = function() {
    window.tempNewSem = { year: '大一', term: '上' };
    updateSemControlUI();
    document.getElementById("add-semester-modal").classList.add("active");
};

window.selectSemPart = function(type, val) {
    window.tempNewSem[type] = val;
    updateSemControlUI();
};

function updateSemControlUI() {
    const termMap = { '上':'上學期', '下':'下學期', '暑':'暑修', '寒':'寒修' };
    
    document.querySelectorAll('#sem-year-control .seg-item').forEach(el => {
        el.classList.toggle('active', el.innerText === window.tempNewSem.year);
    });
    
    document.querySelectorAll('#sem-term-control .seg-item').forEach(el => {
        el.classList.toggle('active', el.innerText === termMap[window.tempNewSem.term]);
    });
    
    document.getElementById('btn-confirm-add-sem').innerText = `新增 ${window.tempNewSem.year}${window.tempNewSem.term}`;
}

window.confirmAddSemester = function() {
    const semName = `${window.tempNewSem.year}${window.tempNewSem.term}`;
    
    if (!state.credits.semesterOrder.includes(semName)) {
        state.credits.semesterOrder.push(semName);
        
        const yearOrder = { '大一':1, '大二':2, '大三':3, '大四':4, '大五':5, '大六':6 };
        const termOrder = { '上':1, '寒':2, '下':3, '暑':4 };
        
        state.credits.semesterOrder.sort((a, b) => {
            const yA = yearOrder[a.substring(0, 2)] || 99;
            const tA = termOrder[a.substring(2)] || 99;
            const yB = yearOrder[b.substring(0, 2)] || 99;
            const tB = termOrder[b.substring(2)] || 99;
            if (yA !== yB) return yA - yB;
            return tA - tB;
        });

        state.credits.semesters[semName] = [];
        window.currentCreditSemester = semName; 
        
        saveToStorage();
        renderCreditCalculator();
        closeModal('add-semester-modal');
        showToast(`已切換至 ${semName}`);
    } else {
        showToast("學期名稱已存在", "error");
    }
};

window.deleteCreditSemester = function(semName) {
    if (!semName) return;
    
    showConfirm(`確定要刪除「${semName}」及其內的所有成績嗎？`, () => {
        state.credits.semesterOrder = state.credits.semesterOrder.filter(s => s !== semName);
        delete state.credits.semesters[semName];
        window.currentCreditSemester = state.credits.semesterOrder.length > 0 ? state.credits.semesterOrder[0] : null;
        
        saveToStorage();
        renderCreditCalculator();
        showToast(`已刪除 ${semName}`);
    });
};

window.addCreditCourse = function(sem) {
    if (!state.credits.semesters[sem]) state.credits.semesters[sem] = [];
    
    const firstCat = state.credits.domains.length > 0 ? state.credits.domains[0].name : "自訂";
    state.credits.semesters[sem].push({
        id: "cc_" + Date.now() + Math.floor(Math.random()*1000),
        name: "", category: firstCat, credits: 2, score: "", grade: "", gpa: ""
    });
    
    saveToStorage();
    renderCreditCalculator();
};

window.deleteCreditCourse = function(sem, id) {
    showConfirm("確定刪除此課程紀錄？", () => {
        state.credits.semesters[sem] = state.credits.semesters[sem].filter(c => c.id !== id);
        saveToStorage();
        renderCreditCalculator();
        showToast("已刪除");
    });
};

window.openImportScheduleModal = function(sem) {
    triggerHaptic(10);
    const listEl = document.getElementById("import-schedule-list");
    listEl.innerHTML = "";
    
    if (state.schedules.length === 0) {
        listEl.innerHTML = `<div style="padding: 10px; text-align: center; color: var(--text-muted);">尚無任何課表</div>`;
    } else {
        state.schedules.forEach(sch => {
            const item = document.createElement("div");
            item.className = "settings-item"; // 沿用設定選單的樣式使其整潔
            item.style.cssText = "border:1px solid var(--border); border-radius:8px; padding:10px; display:flex; justify-content:space-between; align-items:center; cursor:default;";
            
            item.innerHTML = `
                <div>
                    <div style="font-weight:bold; font-size:0.9rem;">${escapeHtml(sch.title)}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${formatSlashDate(sch.startDate)} ~ ${formatSlashDate(sch.endDate)}</div>
                </div>
                <button class="btn" style="padding:4px 12px; font-size:0.75rem; border-radius:16px;" onclick="confirmImportSchedule('${escapeJS(sem)}', '${sch.id}')">匯入</button>
            `;
            listEl.appendChild(item);
        });
    }
    document.getElementById("import-schedule-modal").classList.add("active");
};

window.confirmImportSchedule = function(sem, schId) {
    const sch = state.schedules.find(s => s.id === schId);
    if (!sch) return;
    
    showConfirm(`確定要將「${sch.title}」的課程匯入到「${sem}」嗎？`, () => {
        const courses = Object.values(sch.courses || {}).filter(c => c && c.name);
        const customs = (sch.customCourses || []).filter(c => c && c.name);
        const allCourses = [...courses, ...customs];
        
        if (!state.credits.semesters[sem]) state.credits.semesters[sem] = [];
        
        const existingNames = new Set(state.credits.semesters[sem].map(c => c.name));
        let addCount = 0;
        
        allCourses.forEach(c => {
            if (existingNames.has(c.name)) return; 
            existingNames.add(c.name);
            
            // 讀取設定好的屬性，如果計算機沒有這個領域則歸類到首個領域或自訂
            let mappedCat = c.type;
            if (!state.credits.domains.some(d => d.name === mappedCat)) {
                mappedCat = state.credits.domains[0]?.name || "自訂";
            }
            
            // 讀取學分，如果未設定則預設帶入 2
            let importedCredits = (c.credits !== undefined && c.credits !== "") ? Number(c.credits) : 2;
            
            state.credits.semesters[sem].push({
                id: "cc_" + Date.now() + Math.floor(Math.random()*1000),
                name: c.name, category: mappedCat, credits: importedCredits, score: "", grade: "", gpa: ""
            });
            addCount++;
        });
        
        saveToStorage();
        renderCreditCalculator();
        closeModal("import-schedule-modal");
        showToast(addCount > 0 ? `成功匯入 ${addCount} 門課程` : "無新課程可匯入");
    });
};

// ================= 等第設定 =================
window.openGradeScaleModal = function() {
    const tbody = document.getElementById('grade-scale-body');
    
    tbody.innerHTML = state.credits.gradeScale.map((s, i) => `
        <tr style="border-bottom: 1px solid var(--border);">
            <td class="grade-input-td"><input type="number" id="gs-min-${i}" value="${s.min}"></td>
            <td class="grade-input-td"><input type="number" id="gs-max-${i}" value="${s.max}"></td>
            <td class="grade-input-td"><input type="text" id="gs-grade-${i}" value="${escapeHtml(s.grade)}" style="font-weight:bold; color:var(--primary);"></td>
            <td class="grade-input-td"><input type="number" step="0.1" id="gs-gpa-${i}" value="${s.gpa}" style="font-weight:bold;"></td>
        </tr>
    `).join('');
    
    document.getElementById("grade-scale-modal").classList.add("active");
};

window.saveGradeScale = function() {
    let newScale = [];
    
    for (let i = 0; i < state.credits.gradeScale.length; i++) {
        newScale.push({
            min: parseFloat(document.getElementById(`gs-min-${i}`).value) || 0,
            max: parseFloat(document.getElementById(`gs-max-${i}`).value) || 0,
            grade: document.getElementById(`gs-grade-${i}`).value.trim(),
            gpa: parseFloat(document.getElementById(`gs-gpa-${i}`).value) || 0
        });
    }
    
    state.credits.gradeScale = newScale;
    saveToStorage();
    closeModal('grade-scale-modal');
    renderCreditCalculator();
    showToast('等第設定已儲存，成績已重新結算');
};

window.resetGradeScale = function() {
    showConfirm("確定還原為預設等第表嗎？", () => {
        state.credits.gradeScale = structuredClone(DEFAULT_GRADE_SCALE);
        saveToStorage();
        openGradeScaleModal();
        showToast('已還原預設');
    });
};

// ================= 設定領域與目標 =================
window.openCreditSettings = function() {
    window.renderSettingsDomainList();
    document.getElementById("credit-settings-modal").classList.add("active");
};

window.renderSettingsDomainList = function() {
    const listEl = document.getElementById("credit-settings-domains-list");
    let currentTotal = 0;
    let html = "";
    
    state.credits.domains.forEach((d, idx) => {
        currentTotal += Number(d.target);
        const isReadonly = d.name === '系必修' ? 'readonly style="color:var(--text-muted);"' : '';
        
        html += `
            <div class="setting-domain-card">
                <div class="setting-domain-row">
                    <div class="setting-checkbox ${d.isMajor ? 'checked' : ''}" onclick="toggleDomainMajor(${idx})"></div>
                    <input type="text" class="setting-input-clean" value="${escapeHtml(d.name)}" onchange="updateDomainName(${idx}, this.value)" ${isReadonly}>
                    <input type="number" class="setting-target-input" value="${d.target}" onchange="updateDomainTarget(${idx}, this.value)">
                    <button class="setting-icon-btn" onclick="deleteCreditDomain(${idx})">🗑️</button>
                </div>
            </div>
        `;
    });
    
    document.getElementById("settings-current-total").innerText = currentTotal;
    listEl.innerHTML = html;
};

window.toggleDomainMajor = function(idx) {
    triggerHaptic(10);
    state.credits.domains[idx].isMajor = !state.credits.domains[idx].isMajor;
    saveToStorage();
    window.renderSettingsDomainList();
};

window.updateDomainTarget = function(idx, val) {
    state.credits.domains[idx].target = parseFloat(val) || 0;
    // 更新數值時，立即重新計算總和
    state.credits.targetTotal = state.credits.domains.reduce((sum, d) => sum + (Number(d.target) || 0), 0);
    saveToStorage();
    window.renderSettingsDomainList();
};

window.updateDomainName = function(idx, val) {
    const oldName = state.credits.domains[idx].name;
    const newName = val.trim();
    if (!newName) return;
    
    state.credits.domains[idx].name = newName;
    Object.keys(state.credits.semesters).forEach(sem => {
        state.credits.semesters[sem].forEach(c => {
            if (c.category === oldName) c.category = newName;
        });
    });
    
    saveToStorage();
    window.renderSettingsDomainList();
};

window.deleteCreditDomain = function(idx) {
    showConfirm("確定刪除此領域？", () => {
        state.credits.domains.splice(idx, 1);
        state.credits.targetTotal = state.credits.domains.reduce((sum, d) => sum + (Number(d.target) || 0), 0);
        saveToStorage();
        window.renderSettingsDomainList();
    });
};

window.saveCreditSettings = function() {
    // 總和已經即時更新過了，直接存檔渲染即可
    saveToStorage();
    renderCreditCalculator();
    showToast("設定已儲存");
};

// ========================================================
// 底部操作選單 (Bottom Sheet) 邏輯
// ========================================================
window.openBillingActionMenu = function(idx, isWork) {
    triggerHaptic(10);
    const container = document.getElementById("billing-action-container");
    const toggleFn = isWork ? 'toggleWorkBillStatus' : 'toggleBillStatus';
    const editFn = isWork ? 'openWorkBillingModal' : 'openBillingModal';
    const deleteFn = isWork ? 'deleteWorkBilling' : 'deleteBilling';
    
    // 動態生成按鈕
    container.innerHTML = `
        <button class="action-menu-btn" onclick="closeModal('billing-action-modal'); ${toggleFn}(${idx})">🔄 切換狀態</button>
        <button class="action-menu-btn" onclick="closeModal('billing-action-modal'); ${editFn}(${idx})">✏️ 編輯</button>
        <button class="action-menu-btn danger" onclick="closeModal('billing-action-modal'); ${deleteFn}(${idx})">🗑️ 刪除</button>
    `;
    document.getElementById("billing-action-modal").classList.add("active");
};

window.openFinanceActionMenu = function(id) {
    triggerHaptic(10);
    const i = state.finances.find(f => f.id === id);
    if (!i) return;
    
    const container = document.getElementById("finance-action-container");
    const amt = Number(i.amount);
    const rem = i.remaining !== undefined ? i.remaining : amt;
    const isShared = !!(i.linkedFriendId || i.targetDebtId);
    const isCreditor = i.type === 'receivable' || (i.type === 'income' && i.subCat === '還款');

    let html = "";
    
    // 【修復 2】嚴格禁止對連動帳務 (fin_sync_ 開頭) 進行還款操作
    if ((i.type === "receivable" || i.type === "payable") && rem > 0 && !i.id.startsWith("fin_sync_")) { 
        html += `<button class="action-menu-btn" onclick="closeModal('finance-action-modal'); openRepayModal('${i.id}')">💸 還款</button>`;
    }
    
    html += `<button class="action-menu-btn" onclick="closeModal('finance-action-modal'); toggleRecordHidden('${i.id}')">${i.isHidden ? '👁️ 解除隱藏' : '🙈 隱藏紀錄'}</button>`;
    
    if (!isShared || isCreditor) {
        if (!i.id.startsWith("fin_sync_")) {
            html += `<button class="action-menu-btn" onclick="closeModal('finance-action-modal'); openFinanceModal('${i.id}')">✏️ 編輯</button>`;
            html += `<button class="action-menu-btn danger" onclick="closeModal('finance-action-modal'); deleteFinanceRecord('${i.id}')">🗑️ 刪除</button>`;
        } else {
            html += `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin-top:8px;">此為連動帳務，請至打工/家教頁面編輯</div>`;
        }
    }

    container.innerHTML = html;
    document.getElementById("finance-action-modal").classList.add("active");
};
// ========================================================
// 自訂日曆系統 (Custom Date Picker) 核心邏輯
// ========================================================
let customDpActiveInput = null;
let customDpYear = 2026;
let customDpMonth = 8;
let customDpSelectedDate = "";
let isCustomDpManual = false;

function initCustomDatePicker() {
    const selYear = document.getElementById('custom-dp-sel-year');
    const selMonth = document.getElementById('custom-dp-sel-month');
    if (!selYear || !selMonth) return;

    // 建立年份 (2000 ~ 2100)
    selYear.innerHTML = '';
    for (let y = 2000; y <= 2100; y++) {
        selYear.appendChild(new Option(`${y}年`, y));
    }
    
    // 建立月份 (0 ~ 11)
    selMonth.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        selMonth.appendChild(new Option(`${String(m + 1).padStart(2, '0')}月`, m));
    }

    // 攔截頁面上所有的 input[type="date"]
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.setAttribute('readonly', 'readonly'); // 防止原生小鍵盤彈出
        // 覆寫原生 showPicker 方法 (防止被舊代碼呼叫)
        input.showPicker = function() { 
            this.click(); 
        };
        
        input.addEventListener('click', function(e) {
            e.preventDefault();
            openCustomDatePicker(this);
        });
    });

    // 綁定背景點擊關閉
    document.getElementById('custom-dp-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeCustomDatePicker();
    });

    // 手動輸入自動跳轉機制 (YYYY -> MM -> DD)
    const inY = document.getElementById('custom-dp-in-yyyy');
    const inM = document.getElementById('custom-dp-in-mm');
    const inD = document.getElementById('custom-dp-in-dd');
    
    inY.addEventListener('input', function() { 
        if (this.value.length === 4) inM.focus(); 
    });
    
    inM.addEventListener('input', function() { 
        if (this.value.length === 2) inD.focus(); 
    });
    
    inD.addEventListener('keypress', function(e) { 
        if (e.key === 'Enter') confirmCustomDpManual(); 
    });
}

function openCustomDatePicker(targetInput) {
    triggerHaptic(10);
    customDpActiveInput = targetInput;
    let initDateStr = targetInput.value;
    
    // 若原本沒值，預設給今天
    if (!initDateStr) {
        initDateStr = formatDate(new Date());
    }

    const dateObj = new Date(initDateStr);
    if (!isNaN(dateObj.getTime())) {
        customDpYear = dateObj.getFullYear();
        customDpMonth = dateObj.getMonth();
        customDpSelectedDate = initDateStr;
    }

    renderCustomDpGrid();
    document.getElementById('custom-dp-overlay').classList.add('active');
    
    // 若上次是手動模式，自動切回網格模式體驗較好
    if (isCustomDpManual) toggleCustomDpMode(false);
}

function renderCustomDpGrid() {
    document.getElementById('custom-dp-sel-year').value = customDpYear;
    document.getElementById('custom-dp-sel-month').value = customDpMonth;

    const grid = document.getElementById('custom-dp-grid');
    grid.innerHTML = '';

    const firstDay = new Date(customDpYear, customDpMonth, 1).getDay();
    const daysInMonth = new Date(customDpYear, customDpMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const cell = document.createElement('div');
        const dStr = `${customDpYear}-${String(customDpMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        cell.className = 'custom-dp-cell' + (dStr === customDpSelectedDate ? ' selected' : '');
        cell.innerText = i;
        cell.onclick = () => {
            triggerHaptic(10);
            selectCustomDpDate(dStr);
        };
        grid.appendChild(cell);
    }
}

function changeCustomDpMonth(offset) {
    triggerHaptic(10);
    customDpMonth += offset;
    
    if (customDpMonth < 0) { 
        customDpMonth = 11; 
        customDpYear--; 
    } else if (customDpMonth > 11) { 
        customDpMonth = 0; 
        customDpYear++; 
    }
    
    renderCustomDpGrid();
}

function jumpCustomDpDate() {
    triggerHaptic(10);
    customDpYear = parseInt(document.getElementById('custom-dp-sel-year').value);
    customDpMonth = parseInt(document.getElementById('custom-dp-sel-month').value);
    renderCustomDpGrid();
}

function selectCustomDpDate(dateStr) {
    customDpSelectedDate = dateStr;
    renderCustomDpGrid();
    
    // 把選好的值塞回原本的 input，並發送 onchange 事件觸發原本的存檔邏輯
    if (customDpActiveInput) {
        customDpActiveInput.value = dateStr;
        const evt = new Event('change', { bubbles: true });
        customDpActiveInput.dispatchEvent(evt);
    }
    
    setTimeout(() => closeCustomDatePicker(), 150);
}

function toggleCustomDpMode(forceToggle) {
    triggerHaptic(10);
    isCustomDpManual = forceToggle !== undefined ? forceToggle : !isCustomDpManual;
    
    const viewGrid = document.getElementById('custom-dp-view-grid');
    const viewManual = document.getElementById('custom-dp-view-manual');
    const btn = document.getElementById('custom-dp-toggle-btn');

    if (isCustomDpManual) {
        viewGrid.style.display = 'none';
        viewManual.style.display = 'flex';
        btn.innerHTML = '網格選擇';

        const parts = customDpSelectedDate.split('-');
        if (parts.length === 3) {
            document.getElementById('custom-dp-in-yyyy').value = parts[0];
            document.getElementById('custom-dp-in-mm').value = parts[1];
            document.getElementById('custom-dp-in-dd').value = parts[2];
        }
    } else {
        viewGrid.style.display = 'block';
        viewManual.style.display = 'none';
        btn.innerHTML = '手動輸入';
    }
}

function confirmCustomDpManual() {
    triggerHaptic(10);
    const y = document.getElementById('custom-dp-in-yyyy').value.trim();
    const m = document.getElementById('custom-dp-in-mm').value.trim();
    const d = document.getElementById('custom-dp-in-dd').value.trim();

    if (y.length !== 4 || m.length === 0 || d.length === 0) {
        showToast('請完整輸入 YYYY / MM / DD', 'error');
        return;
    }

    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const dateObj = new Date(dateStr);

    if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() == y && dateObj.getMonth() + 1 == m && dateObj.getDate() == d) {
        selectCustomDpDate(dateStr);
    } else {
        showToast('無效的日期，請檢查是否輸入錯誤', 'error');
    }
}

function closeCustomDatePicker() {
    document.getElementById('custom-dp-overlay').classList.remove('active');
    if (isCustomDpManual) {
        setTimeout(() => toggleCustomDpMode(false), 200);
    }
}

function jumpCustomDpToToday() {
    triggerHaptic(10);
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    
    // 更新日曆內部狀態為今天
    customDpYear = today.getFullYear();
    customDpMonth = today.getMonth();
    
    // 如果目前在「手動輸入」模式，點擊今天時自動切回網格模式
    if (isCustomDpManual) {
        toggleCustomDpMode(false);
    }
    
    // 直接觸發選取並關閉
    selectCustomDpDate(todayStr);
}

// ========================================================
// 程式進入點 (確保最後執行)
// ========================================================
if (typeof init === 'function') {
    init();
}
