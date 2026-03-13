import { supabase } from '../integrations/supabase/client'

export const createNotification = async (
  complaintId: string,
  complaintCode: string,
  stage: 'confirmation' | 'acknowledgement' | 'resolution',
  message: string,
  userId?: string
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        complaint_id: complaintId,
        complaint_code: complaintCode,
        stage,
        message,
        user_id: userId || 'anonymous',
        is_read: false
      })

    if (error) {
      console.error('Error creating notification:', error)
    }
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

// Helper function to get translated message
export const getTranslatedMessage = (
  stage: 'confirmation' | 'acknowledgement' | 'resolution',
  complaintCode: string,
  issueType?: string,
  language: string = 'en'
) => {
    const translations: Record<string, Record<string, string>> = {
    en: {
      confirmation: `Your complaint ${complaintCode} for ${issueType || 'the reported issue'} has been registered successfully. We will review it shortly.`,
      acknowledgement: `Your complaint ${complaintCode} has been acknowledged and assigned to the appropriate department.`,
      resolution: `Your complaint ${complaintCode} has been resolved. Thank you for your patience.`
    },
    hi: {
      confirmation: `आपकी शिकायत ${complaintCode} ${issueType || 'रिपोर्ट की गई समस्या'} के लिए सफलतापूर्वक दर्ज की गई है। हम इसे जल्द ही समीक्षा करेंगे।`,
      acknowledgement: `आपकी शिकायत ${complaintCode} को स्वीकार कर लिया गया है और उपयुक्त विभाग को सौंपा गया है।`,
      resolution: `आपकी शिकायत ${complaintCode} हल हो गई है। आपके धैर्य के लिए धन्यवाद।`
    },
    bn: {
      confirmation: `আপনার অভিযোগ ${complaintCode} ${issueType || 'রিপোর্ট করা সমস্যা'} এর জন্য সফলভাবে নিবন্ধিত হয়েছে। আমরা শীঘ্রই এটি পর্যালোচনা করব।`,
      acknowledgement: `আপনার অভিযোগ ${complaintCode} স্বীকৃত হয়েছে এবং উপযুক্ত বিভাগে পাঠানো হয়েছে।`,
      resolution: `আপনার অভিযোগ ${complaintCode} সমাধান হয়েছে। আপনার ধৈর্যের জন্য ধন্যবাদ।`
    },
    te: {
      confirmation: `మీ ఫిర్యాదు ${complaintCode} ${issueType || 'రిపోర్ట్ చేసిన సమస్య'} కోసం విజయవంతంగా నమోదు చేయబడింది. మేము దీనిని త్వరలో సమీక్షిస్తాము.`,
      acknowledgement: `మీ ఫిర్యాదు ${complaintCode} అంగీకరించబడింది మరియు సముచిత విభాగానికి కేటాయించబడింది.`,
      resolution: `మీ ఫిర్యాదు ${complaintCode} పరిష్కరించబడింది. మీ ఓపికకు ధన్యవాదాలు.`
    }
  }

  return translations[language]?.[stage] || translations.en[stage]
}

export const createComplaintNotifications = async (
  complaintId: string, 
  complaintCode: string, 
  issueType: string,
  language: string = 'en'
) => {
  // Confirmation notification
  await createNotification(
    complaintId,
    complaintCode,
    'confirmation',
    getTranslatedMessage('confirmation', complaintCode, issueType, language),
    'anonymous'
  )

  // Acknowledgement notification (simulated delay)
  setTimeout(async () => {
    await createNotification(
      complaintId,
      complaintCode,
      'acknowledgement',
      getTranslatedMessage('acknowledgement', complaintCode, issueType, language),
      'anonymous'
    )
  }, 5000) // 5 seconds delay

  // Resolution notification (simulated delay)
  setTimeout(async () => {
    await createNotification(
      complaintId,
      complaintCode,
      'resolution',
      getTranslatedMessage('resolution', complaintCode, issueType, language),
      'anonymous'
    )
  }, 30000) // 30 seconds delay
}
