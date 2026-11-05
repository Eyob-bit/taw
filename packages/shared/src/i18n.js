/**
 * Bilingual (Amharic & English) translations and templates
 */

export const i18n = {
  en: {
    welcome: {
      title: "Welcome! 👋",
      subtitle: "Welcome to our relationship awareness community.\nYou can anonymously submit questions and share personal experiences.\n\nሰላም! 👋\nወደ ግንኙነት ግንዛቤ ማህበረሰባችን በደህና መጡ።",
      chooseLanguage: "Please choose your preferred language / ቋንቋ ይምረጡ:",
      languageChanged: "Language switched to English 🇬🇧"
    },
    menu: {
      title: "Main Menu",
      areWeDating: "🔍 Are We Dating the Same Guy?",
      safetyConcern: "🛡️ Relationship Safety Concern",
      mySubmissions: "📋 My Submissions",
      help: "❓ Help & Guidelines",
      changeLanguage: "🌐 Change Language",
      cancel: "❌ Cancel",
      back: "⬅️ Back",
      confirm: "✅ Confirm & Submit",
      edit: "✏️ Edit Text"
    },
    guidelines: {
      title: "📜 Community Guidelines & Safety Notice",
      intro: "Before proceeding, please read and agree to our community rules:",
      rule1: "1. Privacy First: Never include phone numbers, exact addresses, or private usernames.",
      rule2: "2. No Defamation: Questions must be respectful and factual. Do not make unverified accusations.",
      rule3: "3. Photos & Evidence: Identifiable face photos or private chats will NOT be published.",
      rule4: "4. Anonymity: Your submission is published anonymously. Your Telegram account ID is securely held in backend records solely to prevent spam and abuse.",
      agreeButton: "✅ I Understand & Agree",
      cancelButton: "❌ Decline & Return"
    },
    submission: {
      promptAreWeDating: "📸 Please send a photo along with your text description/question.\n\n(You can send a photo directly with a caption, or send the photo first then the text).",
      promptSafety: "📸 Please send a photo or screenshot along with your description of the safety concern.\n\nNote: All relationship safety submissions require manual review by our moderators before publication.",
      photoRequired: "⚠️ A photo is required. Please send a photo with your text description.",
      photoReceivedNeedText: "📸 Photo received! Now please send your text description for this post.",
      textReceivedNeedPhoto: "📝 Text received! Now please send the photo to accompany your post.",
      tooShort: "⚠️ Your submission is too short. Please provide at least 10 characters of context.",
      tooLong: "⚠️ Your submission exceeds the maximum limit (3000 characters). Please condense it.",
      piiWarning: "⚠️ Notice: We detected potentially private contact details or identifiers (phones, handles, or links). These will be sanitized or reviewed by moderators to protect privacy.",
      previewTitle: "👀 **Submission Preview**",
      categoryLabel: "Category",
      statusLabel: "Status",
      contentLabel: "Public Text Preview",
      confirmPrompt: "Are you ready to submit this for publishing / review?",
      submittedSuccessAuto: "✅ Your submission has been received and verified! It has been scheduled for publication on our Telegram channel.",
      submittedSuccessReview: "⏳ Your submission has been received! Because it contains sensitive details or safety concerns, it has been forwarded to our moderation team for human review.",
      cancelled: "❌ Action cancelled. Returning to main menu.",
      mySubmissionsEmpty: "You have not submitted any questions or reports yet.",
      noDirectIdentifiablePhotos: "⚠️ Photos containing identifiable faces are kept private for evidence and will not be posted publicly."
    },
    help: {
      content: `💡 **About This Platform**\n\nThis community aims to foster awareness, safety, and mutual support in relationships across Ethiopia.\n\n• **Are We Dating the Same Guy?**: Ask questions to clarify overlapping relationships respectfully.\n• **Relationship Safety**: Report dishonesty, manipulation, financial fraud, or abuse.\n\n🔒 **Privacy Promise**:\n- Your Telegram username is never published.\n- Private phone numbers, accounts, and face photos are redacted.\n- You can track your submissions under "📋 My Submissions".\n\nNeed to report a post? Use /report or contact our administrators.`
    },
    publication: {
      disclaimerAreWeDating: `⚠️ This is a question, not an accusation. A post in this category does not mean that anyone has done something wrong.\n\nIf you have relevant information, contact the channel administrators privately.\n\n🔒 Respect everyone's privacy. Do not spread unverified information.`,
      disclaimerSafety: `⚠️ This is a personal account and safety concern shared for community awareness, not an independently verified legal finding.\n\nIf you have relevant information or questions, contact the administrators privately.\n\n🔒 Respect everyone's privacy and dignity.`
    }
  },
  am: {
    welcome: {
      title: "ሰላም! 👋",
      subtitle: "ወደ ግንኙነት ግንዛቤ እና ጥንቃቄ ማህበረሰብ በደህና መጡ።\nእዚህ ጥያቄዎችን ማንሳት እና የግል ተሞክሮዎችን በሚስጥር ማጋራት ይችላሉ።\n\nWelcome to our relationship awareness community.\nYou can anonymously submit questions and share personal experiences.",
      chooseLanguage: "እባክዎ የሚፈልጉትን ቋንቋ ይምረጡ / Please choose language:",
      languageChanged: "ቋንቋው ወደ አማርኛ ተቀይሯል 🇪🇹"
    },
    menu: {
      title: "ዋና ማውጫ",
      areWeDating: "🔍 እኛ አንድ ሰው ጋር እየተገናኘን ነው?",
      safetyConcern: "🛡️ የግንኙነት ደህንነት ማስጠንቀቂያ",
      mySubmissions: "📋 ያቀረብኳቸው ጽሁፎች",
      help: "❓ መመሪያ እና እገዛ",
      changeLanguage: "🌐 ቋንቋ ቀይር",
      cancel: "❌ ሰርዝ",
      back: "⬅️ ተመለስ",
      confirm: "✅ አረጋግጥና ላክ",
      edit: "✏️ ጽሁፉን አድስ"
    },
    guidelines: {
      title: "📜 የማህበረሰብ ደንቦች እና የግላዊነት ማስጠንቀቂያ",
      intro: "ከመቀጠልዎ በፊት እባክዎ ደንቦቻችንን በጥንቃቄ ያንብቡና ይቀበሉ፡",
      rule1: "1. የግላዊነት ጥበቃ፡ የስልክ ቁጥሮችን፣ ትክክለኛ የመኖሪያ አድራሻዎችን ወይም የግል የቴሌግራም/ኢንስታግራም መለያዎችን በፍጹም አያካትቱ።",
      rule2: "2. ስም አለማጥፋት፡ ጥያቄዎች በክብር እና በእውነት ላይ የተመሰረቱ መሆን አለባቸው። ያልተረጋገጠ ውንጀላ አይፈቀድም።",
      rule3: "3. ፎቶዎች እና ማስረጃዎች፡ የሰዎችን ፊት በግልጽ የሚያሳዩ ፎቶዎች ወይም የግል የቻት ስክሪንሾቶች ለህዝብ አይለጠፉም።",
      rule4: "4. ሚስጥራዊነት፡ ጽሁፍዎ ማንነትዎ ሳይገለጽ ይለጠፋል። የእርስዎ የቴሌግራም መለያ መረጃ ለስርዓቱ ደህንነትና ማጭበርበርን ለመከላከል ብቻ በደህንነት ይቀመጣል።",
      agreeButton: "✅ ተረድቻለሁ፤ ተስማምቻለሁ",
      cancelButton: "❌ አልስማማም፤ ተመለስ"
    },
    submission: {
      promptAreWeDating: "📸 እባክዎ ፎቶውን ከጥያቄዎ ወይም ተሞክሮዎ ጽሑፍ ጋር አብረው ይላኩ (ፎቶውን ልከው Caption ላይ ጽሑፉን ይጻፉ፣ ወይም ፎቶውን ከላኩ በኋላ ጽሑፉን ይላኩ)።\n\nአጋዥ መረጃዎችን (ከተማ/ሰፈር፣ የመጀመርያ ስም ወይም ቅጽል ስም) ያካትቱ፤ ነገር ግን የግል ስልክ ቁጥር አያስገቡ።",
      promptSafety: "📸 እባክዎ ፎቶውን ወይም ማስረጃውን ከደህንነት ስጋት መግለጫ ጽሑፉ ጋር አብረው ይላኩ።\n\nማስታወሻ፡ የግንኙነት ደህንነት ማስጠንቀቂያ ጽሁፎች ለህዝብ ከመለጠፋቸው በፊት በአወያዮቻችን በጥንቃቄ ይገመገማሉ።",
      photoRequired: "⚠️ ፎቶ ማስገባት ግዴታ ነው። እባክዎ ከጽሑፉ ጋር ፎቶ አብረው ይላኩ።",
      photoReceivedNeedText: "📸 ፎቶው ደርሶናል! አሁን እባክዎ አብሮ የሚለጠፈውን ጽሑፍ ይላኩ።",
      textReceivedNeedPhoto: "📝 ጽሑፉ ደርሶናል! አሁን እባክዎ አብሮ የሚለጠፈውን ፎቶ ይላኩ።",
      tooShort: "⚠️ የጻፉት ጽሁፍ በጣም አጭር ነው። እባክዎ ቢያንስ 10 ፊደላት/ቃላት ያካቱ።",
      tooLong: "⚠️ የጻፉት ጽሁፍ ከሚፈቀደው በላይ ረጅም ነው (ከ3000 ፊደላት በላይ)። እባክዎ ያሳጥሩት።",
      piiWarning: "⚠️ ማስታወቂያ፡ በጽሁፍዎ ውስጥ የግል መገኛ መረጃ (ስልክ ቁጥር፣ መለያ ወይም ሊንክ) ተገኝቷል። ግላዊነትን ለመጠበቅ ይስተካከላል ወይም በአወያይ ይታያል።",
      previewTitle: "👀 **የጽሁፉ ቅድመ እይታ**",
      categoryLabel: "ምድብ",
      statusLabel: "ሁኔታ",
      contentLabel: "ለህዝብ የሚታይ ጽሁፍ",
      confirmPrompt: "ይህ ጽሁፍ እንዲለጠፍ/እንዲገመገም ዝግጁ ነዎት?",
      submittedSuccessAuto: "✅ ጽሁፍዎ ተቀባይነት አግኝቷል! በቴሌግራም ቻናላችን ላይ ለመለጠፍ ተመድቧል።",
      submittedSuccessReview: "⏳ ጽሁፍዎ ደርሶናል! ጥንቃቄ የሚሹ መረጃዎችን የያዘ በመሆኑ በአወያዮቻችን ተገምግሞ ምላሽ ይሰጥዎታል።",
      cancelled: "❌ ሂደቱ ተሰርዟል። ወደ ዋናው ማውጫ ተመልሰዋል።",
      mySubmissionsEmpty: "እስካሁን ያቀረቡት ምንም አይነት ጥያቄ ወይም ጽሁፍ የለም።",
      noDirectIdentifiablePhotos: "⚠️ የሰው ፊት በግልጽ የሚያሳዩ ፎቶዎች ለማስረጃነት ብቻ ተይዘው ለህዝብ አይለጠፉም።"
    },
    help: {
      content: `💡 **ስለ ፕላትፎርሙ አጭር መረጃ**\n\nይህ ማህበረሰብ በኢትዮጵያ ውስጥ ባሉ ግንኙነቶች ዙሪያ ግንዛቤን፣ ጥንቃቄን እና የጋራ መረዳዳትን ለማሳደግ ያለመ ነው።\n\n• **እኛ አንድ ሰው ጋር እየተገናኘን ነው?**፡ ተደራራቢ ግንኙነቶችን በጨዋነት ለማጣራት የቀረበ ክፍል።\n• **የግንኙነት ደህንነት**፡ ማጭበርበርን፣ ጥቃትን ወይም የደህንነት ስጋቶችን ለማሳወቅ።\n\n🔒 **የግላዊነት ዋስትናችን**:\n- የእርስዎ የቴሌግራም ስም ለህዝብ አይታይም።\n- የግል ስልክ ቁጥሮች እና ፎቶዎች በግልጽ አይለጠፉም።\n- ያቀረቡትን ጽሁፍ ሁኔታ በ"📋 ያቀረብኳቸው ጽሁፎች" ማየት ይችላሉ።\n\nየተለጠፈ ጽሁፍን ሪፖርት ለማድረግ /report ይጠቀሙ ወይም አድሚኖችን ያነጋግሩ።`
    },
    publication: {
      disclaimerAreWeDating: `⚠️ ይህ ጥያቄ ብቻ ነው። በዚህ ስር የቀረበ ጥያቄ ማንኛውም ሰው ጥፋት ሰርቷል ወይም የተሳሳተ ነገር ፈጽሟል ማለት አይደለም!!!\n\nማንኛውም መረጃ ወይም ምላሽ ካላችሁ በChannel Direct Message በኩል አግኙን።\n\n🔒 የሌሎችን ግላዊነት ያክብሩ። ያልተረጋገጠ መረጃ አታሰራጩ።`,
      disclaimerSafety: `⚠️ ይህ በግል የተጋራ ተሞክሮ እና ማስጠንቀቂያ ነው። በግል የተገለጸ እንጂ በገለልተኛ አካል የተረጋገጠ ውሳኔ አይደለም።\n\nማንኛውም ጥያቄ ወይም መረጃ ካላችሁ አድሚኖችን ያነጋግሩ።\n\n🔒 የሌሎችን ግላዊነት ያክብሩ። ስም አያጥፉ።`
    }
  }
};

export function getTranslation(lang = 'en') {
  return i18n[lang] || i18n.en;
}

