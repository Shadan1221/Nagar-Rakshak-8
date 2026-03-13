import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'gu' | 'mr' | 'kn' | 'ml' | 'pa'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation data for all supported languages
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'app.title': 'Nagar Rakshak',
    'app.subtitle': 'Your Voice, Your City\'s Future',
    'app.citizenPowered': 'Citizen Powered',
    'app.mobileFirst': 'Mobile First',
    'app.empoweringCitizens': 'Empowering citizens to build better communities',
    'app.madeForIndia': 'Made for Digital India',
    
    // Navigation
    'nav.login': 'Login',
    'nav.loginDesc': 'Quick login with credentials',
    'nav.signup': 'New Citizen Signup',
    'nav.signupDesc': 'Quick OTP account creation',
    'nav.admin': 'Admin Portal',
    'nav.adminDesc': 'Government officials',
    'nav.back': 'Back',
    'nav.dashboard': 'Citizen Dashboard',
    'nav.welcome': 'Welcome, Nagar Rakshak!',
    
    // Dashboard
    'dashboard.issuesResolved': 'Issues Resolved',
    'dashboard.inProgress': 'In Progress',
    'dashboard.registerComplaint': 'Register New Complaint',
    'dashboard.registerDesc': 'Report civic issues in your area',
    'dashboard.quickSubmit': 'Quick Submit',
    'dashboard.trackComplaint': 'Track Complaint Status',
    'dashboard.trackDesc': 'Monitor your reports progress',
    'dashboard.realTimeUpdates': 'Real-time Updates',
    'dashboard.emergencyHelplines': 'Emergency Helplines',
    'dashboard.helplineDesc': 'Important contact numbers',
    'dashboard.available247': '24/7 Available',
    'dashboard.recentActivity': 'Recent Activity Near Me',
    'dashboard.communityImpact': 'Community Impact',
    'dashboard.impactDesc': 'Your reports have helped improve 5 civic issues this month!',
    'dashboard.activeCitizenBadge': 'Active Citizen Badge',
    
    // Complaint Registration
    'complaint.title': 'Register Complaint',
    'complaint.location': 'Location Details',
    'complaint.state': 'State',
    'complaint.city': 'City',
    'complaint.district': 'District',
    'complaint.address1': 'Address Line 1',
    'complaint.address2': 'Address Line 2',
    'complaint.issueType': 'Issue Type',
    'complaint.description': 'Description',
    'complaint.media': 'Upload Media',
    'complaint.audio': 'Voice Note',
    'complaint.gps': 'GPS Location',
    'complaint.submit': 'Submit Complaint',
    'complaint.success': 'Complaint Registered Successfully!',
    'complaint.id': 'Complaint ID',
    'complaint.thankYou': 'Thank you for reporting this issue. We will review it shortly.',
    'complaint.backToDashboard': 'Back to Dashboard',
    
    // Issue Types
    'issue.streetlight': 'Street Light Issues',
    'issue.pothole': 'Pothole/Road Damage',
    'issue.garbage': 'Garbage Collection',
    'issue.drainage': 'Drainage Problems',
    'issue.water': 'Water Supply Issues',
    'issue.electricity': 'Power Outage',
    'issue.noise': 'Noise Pollution',
    'issue.others': 'Other Issues',
    
    // Complaint Tracking
    'tracking.title': 'Track Complaint',
    'tracking.enterId': 'Enter Complaint ID',
    'tracking.search': 'Search',
    'tracking.status': 'Status',
    'tracking.registered': 'Registered',
    'tracking.assigned': 'Assigned',
    'tracking.inProgress': 'In Progress',
    'tracking.resolved': 'Resolved',
    'tracking.details': 'Complaint Details',
    'tracking.timeline': 'Status Timeline',
    'tracking.noComplaint': 'No complaint found with this ID',
    
    // Notifications
    'notification.title': 'Notifications',
    'notification.noNotifications': 'No notifications yet',
    'notification.confirmation': 'Confirmation',
    'notification.acknowledgement': 'Acknowledgement',
    'notification.resolution': 'Resolution',
    'notification.complaintRegistered': 'Your complaint {code} for {type} has been registered successfully.',
    'notification.complaintAcknowledged': 'Your complaint {code} has been acknowledged and assigned to the appropriate department.',
    'notification.complaintResolved': 'Your complaint {code} has been resolved. Thank you for your patience.',
    
    // Helpline
    'helpline.title': 'Emergency Helplines',
    'helpline.police': 'Police',
    'helpline.fire': 'Fire Department',
    'helpline.ambulance': 'Ambulance',
    'helpline.municipal': 'Municipal Corporation',
    'helpline.electricity': 'Electricity Board',
    'helpline.water': 'Water Board',
    
    // Common Actions
    'action.submit': 'Submit',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.clear': 'Clear',
    'action.loading': 'Loading...',
    'action.error': 'Error',
    'action.success': 'Success',
    'action.required': 'Required field',
    'action.optional': 'Optional',
  },
  
  hi: {
    // Common
    'app.title': 'नगर रक्षक',
    'app.subtitle': 'आपकी आवाज़, आपके शहर का भविष्य',
    'app.citizenPowered': 'नागरिक संचालित',
    'app.mobileFirst': 'मोबाइल प्रथम',
    'app.empoweringCitizens': 'बेहतर समुदाय बनाने के लिए नागरिकों को सशक्त बनाना',
    'app.madeForIndia': 'डिजिटल इंडिया के लिए बनाया गया',
    
    // Navigation
    'nav.login': 'फोन से लॉगिन करें',
    'nav.loginDesc': 'त्वरित OTP सत्यापन',
    'nav.signup': 'नया नागरिक साइनअप',
    'nav.signupDesc': 'आंदोलन में शामिल हों',
    'nav.admin': 'एडमिन पोर्टल',
    'nav.adminDesc': 'सरकारी अधिकारी',
    'nav.back': 'वापस',
    'nav.dashboard': 'नागरिक डैशबोर्ड',
    'nav.welcome': 'स्वागत है, नगर रक्षक!',
    
    // Dashboard
    'dashboard.issuesResolved': 'समस्याएं हल',
    'dashboard.inProgress': 'प्रगति में',
    'dashboard.registerComplaint': 'नई शिकायत दर्ज करें',
    'dashboard.registerDesc': 'अपने क्षेत्र में नागरिक समस्याओं की रिपोर्ट करें',
    'dashboard.quickSubmit': 'त्वरित जमा',
    'dashboard.trackComplaint': 'शिकायत स्थिति ट्रैक करें',
    'dashboard.trackDesc': 'अपनी रिपोर्ट की प्रगति की निगरानी करें',
    'dashboard.realTimeUpdates': 'वास्तविक समय अपडेट',
    'dashboard.emergencyHelplines': 'आपातकालीन हेल्पलाइन',
    'dashboard.helplineDesc': 'महत्वपूर्ण संपर्क नंबर',
    'dashboard.available247': '24/7 उपलब्ध',
    'dashboard.recentActivity': 'हाल की गतिविधि',
    'dashboard.communityImpact': 'समुदाय प्रभाव',
    'dashboard.impactDesc': 'आपकी रिपोर्ट ने इस महीने 5 नागरिक समस्याओं को सुधारने में मदद की है!',
    'dashboard.activeCitizenBadge': 'सक्रिय नागरिक बैज',
    
    // Complaint Registration
    'complaint.title': 'शिकायत दर्ज करें',
    'complaint.location': 'स्थान विवरण',
    'complaint.state': 'राज्य',
    'complaint.city': 'शहर',
    'complaint.district': 'जिला',
    'complaint.address1': 'पता पंक्ति 1',
    'complaint.address2': 'पता पंक्ति 2',
    'complaint.issueType': 'समस्या का प्रकार',
    'complaint.description': 'विवरण',
    'complaint.media': 'फोटो/वीडियो जोड़ें',
    'complaint.audio': 'वॉइस नोट',
    'complaint.gps': 'GPS स्थान',
    'complaint.submit': 'शिकायत जमा करें',
    'complaint.success': 'शिकायत सफलतापूर्वक दर्ज!',
    'complaint.id': 'शिकायत ID',
    'complaint.thankYou': 'इस समस्या की रिपोर्ट करने के लिए धन्यवाद। हम इसे जल्द ही समीक्षा करेंगे।',
    'complaint.backToDashboard': 'डैशबोर्ड पर वापस जाएं',
    
    // Issue Types
    'issue.streetlight': 'स्ट्रीट लाइट समस्याएं',
    'issue.pothole': 'गड्ढे/सड़क क्षति',
    'issue.garbage': 'कचरा संग्रह',
    'issue.drainage': 'जल निकासी समस्याएं',
    'issue.water': 'पानी की आपूर्ति समस्याएं',
    'issue.electricity': 'बिजली बंद',
    'issue.noise': 'ध्वनि प्रदूषण',
    'issue.others': 'अन्य समस्याएं',
    
    // Complaint Tracking
    'tracking.title': 'शिकायत ट्रैक करें',
    'tracking.enterId': 'शिकायत ID दर्ज करें',
    'tracking.search': 'खोजें',
    'tracking.status': 'स्थिति',
    'tracking.registered': 'दर्ज',
    'tracking.assigned': 'निर्दिष्ट',
    'tracking.inProgress': 'प्रगति में',
    'tracking.resolved': 'हल',
    'tracking.details': 'शिकायत विवरण',
    'tracking.timeline': 'स्थिति समयरेखा',
    'tracking.noComplaint': 'इस ID के साथ कोई शिकायत नहीं मिली',
    
    // Notifications
    'notification.title': 'सूचनाएं',
    'notification.noNotifications': 'अभी तक कोई सूचना नहीं',
    'notification.confirmation': 'पुष्टि',
    'notification.acknowledgement': 'स्वीकृति',
    'notification.resolution': 'समाधान',
    'notification.complaintRegistered': 'आपकी शिकायत {code} {type} के लिए सफलतापूर्वक दर्ज की गई है।',
    'notification.complaintAcknowledged': 'आपकी शिकायत {code} को स्वीकार कर लिया गया है और उपयुक्त विभाग को सौंपा गया है।',
    'notification.complaintResolved': 'आपकी शिकायत {code} हल हो गई है। आपके धैर्य के लिए धन्यवाद।',
    
    // Helpline
    'helpline.title': 'आपातकालीन हेल्पलाइन',
    'helpline.police': 'पुलिस',
    'helpline.fire': 'अग्निशमन विभाग',
    'helpline.ambulance': 'एम्बुलेंस',
    'helpline.municipal': 'नगर निगम',
    'helpline.electricity': 'बिजली बोर्ड',
    'helpline.water': 'जल बोर्ड',
    
    // Common Actions
    'action.submit': 'जमा करें',
    'action.cancel': 'रद्द करें',
    'action.save': 'सहेजें',
    'action.edit': 'संपादित करें',
    'action.delete': 'हटाएं',
    'action.search': 'खोजें',
    'action.filter': 'फिल्टर',
    'action.clear': 'साफ करें',
    'action.loading': 'लोड हो रहा है...',
    'action.error': 'त्रुटि',
    'action.success': 'सफलता',
    'action.required': 'आवश्यक फील्ड',
    'action.optional': 'वैकल्पिक',
  },
  
  bn: {
    // Common
    'app.title': 'নগর রক্ষক',
    'app.subtitle': 'আপনার কণ্ঠ, আপনার শহরের ভবিষ্যৎ',
    'app.citizenPowered': 'নাগরিক চালিত',
    'app.mobileFirst': 'মোবাইল প্রথম',
    'app.empoweringCitizens': 'ভালো সম্প্রদায় গড়তে নাগরিকদের ক্ষমতায়ন',
    'app.madeForIndia': 'ডিজিটাল ইন্ডিয়ার জন্য তৈরি',
    
    // Navigation
    'nav.login': 'ফোন দিয়ে লগইন',
    'nav.loginDesc': 'দ্রুত OTP যাচাই',
    'nav.signup': 'নতুন নাগরিক সাইনআপ',
    'nav.signupDesc': 'আন্দোলনে যোগ দিন',
    'nav.admin': 'অ্যাডমিন পোর্টাল',
    'nav.adminDesc': 'সরকারি কর্মকর্তা',
    'nav.back': 'ফিরে যান',
    'nav.dashboard': 'নাগরিক ড্যাশবোর্ড',
    'nav.welcome': 'স্বাগতম, নগর রক্ষক!',
    
    // Dashboard
    'dashboard.issuesResolved': 'সমস্যা সমাধান',
    'dashboard.inProgress': 'অগ্রগতিতে',
    'dashboard.registerComplaint': 'নতুন অভিযোগ নিবন্ধন',
    'dashboard.registerDesc': 'আপনার এলাকায় নাগরিক সমস্যার রিপোর্ট করুন',
    'dashboard.quickSubmit': 'দ্রুত জমা',
    'dashboard.trackComplaint': 'অভিযোগের অবস্থা ট্র্যাক করুন',
    'dashboard.trackDesc': 'আপনার রিপোর্টের অগ্রগতি নিরীক্ষণ করুন',
    'dashboard.realTimeUpdates': 'রিয়েল টাইম আপডেট',
    'dashboard.emergencyHelplines': 'জরুরি হেল্পলাইন',
    'dashboard.helplineDesc': 'গুরুত্বপূর্ণ যোগাযোগ নম্বর',
    'dashboard.available247': '24/7 উপলব্ধ',
    'dashboard.recentActivity': 'সাম্প্রতিক কার্যকলাপ',
    'dashboard.communityImpact': 'সম্প্রদায় প্রভাব',
    'dashboard.impactDesc': 'আপনার রিপোর্ট এই মাসে 5টি নাগরিক সমস্যা সমাধানে সাহায্য করেছে!',
    'dashboard.activeCitizenBadge': 'সক্রিয় নাগরিক ব্যাজ',
    
    // Complaint Registration
    'complaint.title': 'অভিযোগ নিবন্ধন',
    'complaint.location': 'অবস্থান বিবরণ',
    'complaint.state': 'রাজ্য',
    'complaint.city': 'শহর',
    'complaint.district': 'জেলা',
    'complaint.address1': 'ঠিকানা লাইন 1',
    'complaint.address2': 'ঠিকানা লাইন 2',
    'complaint.issueType': 'সমস্যার ধরন',
    'complaint.description': 'বিবরণ',
    'complaint.media': 'ছবি/ভিডিও যোগ করুন',
    'complaint.audio': 'ভয়েস নোট',
    'complaint.gps': 'GPS অবস্থান',
    'complaint.submit': 'অভিযোগ জমা দিন',
    'complaint.success': 'অভিযোগ সফলভাবে নিবন্ধিত!',
    'complaint.id': 'অভিযোগ ID',
    'complaint.thankYou': 'এই সমস্যা রিপোর্ট করার জন্য ধন্যবাদ। আমরা শীঘ্রই এটি পর্যালোচনা করব।',
    'complaint.backToDashboard': 'ড্যাশবোর্ডে ফিরে যান',
    
    // Issue Types
    'issue.streetlight': 'রাস্তার আলো সমস্যা',
    'issue.pothole': 'গর্ত/রাস্তার ক্ষতি',
    'issue.garbage': 'আবর্জনা সংগ্রহ',
    'issue.drainage': 'জল নিষ্কাশন সমস্যা',
    'issue.water': 'জল সরবরাহ সমস্যা',
    'issue.electricity': 'বিদ্যুৎ বন্ধ',
    'issue.noise': 'শব্দ দূষণ',
    'issue.others': 'অন্যান্য সমস্যা',
    
    // Complaint Tracking
    'tracking.title': 'অভিযোগ ট্র্যাক করুন',
    'tracking.enterId': 'অভিযোগ ID লিখুন',
    'tracking.search': 'অনুসন্ধান',
    'tracking.status': 'অবস্থা',
    'tracking.registered': 'নিবন্ধিত',
    'tracking.assigned': 'নির্ধারিত',
    'tracking.inProgress': 'অগ্রগতিতে',
    'tracking.resolved': 'সমাধান',
    'tracking.details': 'অভিযোগের বিবরণ',
    'tracking.timeline': 'অবস্থা সময়রেখা',
    'tracking.noComplaint': 'এই ID দিয়ে কোন অভিযোগ পাওয়া যায়নি',
    
    // Notifications
    'notification.title': 'বিজ্ঞপ্তি',
    'notification.noNotifications': 'এখনো কোন বিজ্ঞপ্তি নেই',
    'notification.confirmation': 'নিশ্চিতকরণ',
    'notification.acknowledgement': 'স্বীকৃতি',
    'notification.resolution': 'সমাধান',
    'notification.complaintRegistered': 'আপনার অভিযোগ {code} {type} এর জন্য সফলভাবে নিবন্ধিত হয়েছে।',
    'notification.complaintAcknowledged': 'আপনার অভিযোগ {code} স্বীকৃত হয়েছে এবং উপযুক্ত বিভাগে পাঠানো হয়েছে।',
    'notification.complaintResolved': 'আপনার অভিযোগ {code} সমাধান হয়েছে। আপনার ধৈর্যের জন্য ধন্যবাদ।',
    
    // Helpline
    'helpline.title': 'জরুরি হেল্পলাইন',
    'helpline.police': 'পুলিশ',
    'helpline.fire': 'অগ্নিনির্বাপক বিভাগ',
    'helpline.ambulance': 'অ্যাম্বুলেন্স',
    'helpline.municipal': 'পৌর কর্পোরেশন',
    'helpline.electricity': 'বিদ্যুৎ বোর্ড',
    'helpline.water': 'জল বোর্ড',
    
    // Common Actions
    'action.submit': 'জমা দিন',
    'action.cancel': 'বাতিল',
    'action.save': 'সংরক্ষণ',
    'action.edit': 'সম্পাদনা',
    'action.delete': 'মুছে ফেলুন',
    'action.search': 'অনুসন্ধান',
    'action.filter': 'ফিল্টার',
    'action.clear': 'পরিষ্কার',
    'action.loading': 'লোড হচ্ছে...',
    'action.error': 'ত্রুটি',
    'action.success': 'সফলতা',
    'action.required': 'প্রয়োজনীয় ফিল্ড',
    'action.optional': 'ঐচ্ছিক',
  },
  
  te: {
    // Common
    'app.title': 'నగర రక్షక్',
    'app.subtitle': 'మీ స్వరం, మీ నగరం యొక్క భవిష్యత్తు',
    'app.citizenPowered': 'పౌరులచే నడుపబడుతుంది',
    'app.mobileFirst': 'మొబైల్ మొదట',
    'app.empoweringCitizens': 'మెరుగైన సమాజాన్ని నిర్మించడానికి పౌరులను శక్తివంతం చేయడం',
    'app.madeForIndia': 'డిజిటల్ ఇండియా కోసం తయారు చేయబడింది',
    
    // Navigation
    'nav.login': 'ఫోన్‌తో లాగిన్',
    'nav.loginDesc': 'వేగవంతమైన OTP ధృవీకరణ',
    'nav.signup': 'కొత్త పౌర సైన్‌అప్',
    'nav.signupDesc': 'ఉద్యమంలో చేరండి',
    'nav.admin': 'అడ్మిన్ పోర్టల్',
    'nav.adminDesc': 'ప్రభుత్వ అధికారులు',
    'nav.back': 'వెనుకకు',
    'nav.dashboard': 'పౌర డ్యాష్‌బోర్డ్',
    'nav.welcome': 'స్వాగతం, నగర రక్షక్!',
    
    // Dashboard
    'dashboard.issuesResolved': 'సమస్యలు పరిష్కరించబడ్డాయి',
    'dashboard.inProgress': 'పురోగతిలో',
    'dashboard.registerComplaint': 'కొత్త ఫిర్యాదు నమోదు చేయండి',
    'dashboard.registerDesc': 'మీ ప్రాంతంలో పౌర సమస్యలను నివేదించండి',
    'dashboard.quickSubmit': 'వేగవంతమైన సమర్పణ',
    'dashboard.trackComplaint': 'ఫిర్యాదు స్థితిని ట్రాక్ చేయండి',
    'dashboard.trackDesc': 'మీ నివేదికల పురోగతిని పర్యవేక్షించండి',
    'dashboard.realTimeUpdates': 'రియల్ టైమ్ అప్‌డేట్‌లు',
    'dashboard.emergencyHelplines': 'అత్యవసర సహాయ రేఖలు',
    'dashboard.helplineDesc': 'ముఖ్యమైన సంప్రదింపు నంబర్లు',
    'dashboard.available247': '24/7 అందుబాటులో',
    'dashboard.recentActivity': 'ఇటీవలి కార్యకలాపం',
    'dashboard.communityImpact': 'సమాజ ప్రభావం',
    'dashboard.impactDesc': 'మీ నివేదికలు ఈ నెలలో 5 పౌర సమస్యలను మెరుగుపరచడంలో సహాయపడ్డాయి!',
    'dashboard.activeCitizenBadge': 'క్రియాశీల పౌర బ్యాడ్జ్',
    
    // Complaint Registration
    'complaint.title': 'ఫిర్యాదు నమోదు',
    'complaint.location': 'స్థాన వివరాలు',
    'complaint.state': 'రాష్ట్రం',
    'complaint.city': 'నగరం',
    'complaint.district': 'జిల్లా',
    'complaint.address1': 'చిరునామా లైన్ 1',
    'complaint.address2': 'చిరునామా లైన్ 2',
    'complaint.issueType': 'సమస్య రకం',
    'complaint.description': 'వివరణ',
    'complaint.media': 'ఫోటో/వీడియో జోడించండి',
    'complaint.audio': 'వాయిస్ నోట్',
    'complaint.gps': 'GPS స్థానం',
    'complaint.submit': 'ఫిర్యాదు సమర్పించండి',
    'complaint.success': 'ఫిర్యాదు విజయవంతంగా నమోదు!',
    'complaint.id': 'ఫిర్యాదు ID',
    'complaint.thankYou': 'ఈ సమస్యను నివేదించినందుకు ధన్యవాదాలు. మేము దీనిని త్వరలో సమీక్షిస్తాము.',
    'complaint.backToDashboard': 'డ్యాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి',
    
    // Issue Types
    'issue.streetlight': 'వీధి దీపం సమస్యలు',
    'issue.pothole': 'బొక్కలు/రోడ్‌లు నష్టం',
    'issue.garbage': 'చెత్త సేకరణ',
    'issue.drainage': 'జలనిక్షేపణ సమస్యలు',
    'issue.water': 'నీటి సరఫరా సమస్యలు',
    'issue.electricity': 'విద్యుత్ ఆగిపోవడం',
    'issue.noise': 'శబ్ద కాలుష్యం',
    'issue.others': 'ఇతర సమస్యలు',
    
    // Complaint Tracking
    'tracking.title': 'ఫిర్యాదు ట్రాక్ చేయండి',
    'tracking.enterId': 'ఫిర్యాదు ID నమోదు చేయండి',
    'tracking.search': 'వెతకండి',
    'tracking.status': 'స్థితి',
    'tracking.registered': 'నమోదు',
    'tracking.assigned': 'కేటాయించబడింది',
    'tracking.inProgress': 'పురోగతిలో',
    'tracking.resolved': 'పరిష్కరించబడింది',
    'tracking.details': 'ఫిర్యాదు వివరాలు',
    'tracking.timeline': 'స్థితి కాలక్రమం',
    'tracking.noComplaint': 'ఈ IDతో ఫిర్యాదు కనుగొనబడలేదు',
    
    // Notifications
    'notification.title': 'నోటిఫికేషన్‌లు',
    'notification.noNotifications': 'ఇంకా నోటిఫికేషన్‌లు లేవు',
    'notification.confirmation': 'ధృవీకరణ',
    'notification.acknowledgement': 'అంగీకారం',
    'notification.resolution': 'పరిష్కారం',
    'notification.complaintRegistered': 'మీ ఫిర్యాదు {code} {type} కోసం విజయవంతంగా నమోదు చేయబడింది.',
    'notification.complaintAcknowledged': 'మీ ఫిర్యాదు {code} అంగీకరించబడింది మరియు సముచిత విభాగానికి కేటాయించబడింది.',
    'notification.complaintResolved': 'మీ ఫిర్యాదు {code} పరిష్కరించబడింది. మీ ఓపికకు ధన్యవాదాలు.',
    
    // Helpline
    'helpline.title': 'అత్యవసర సహాయ రేఖలు',
    'helpline.police': 'పోలీసు',
    'helpline.fire': 'అగ్నిమాపక విభాగం',
    'helpline.ambulance': 'అంబులెన్స్',
    'helpline.municipal': 'మున్సిపల్ కార్పొరేషన్',
    'helpline.electricity': 'విద్యుత్ బోర్డు',
    'helpline.water': 'నీటి బోర్డు',
    
    // Common Actions
    'action.submit': 'సమర్పించండి',
    'action.cancel': 'రద్దు చేయండి',
    'action.save': 'సేవ్ చేయండి',
    'action.edit': 'సవరించండి',
    'action.delete': 'తొలగించండి',
    'action.search': 'వెతకండి',
    'action.filter': 'ఫిల్టర్',
    'action.clear': 'క్లియర్',
    'action.loading': 'లోడ్ అవుతోంది...',
    'action.error': 'లోపం',
    'action.success': 'విజయం',
    'action.required': 'అవసరమైన ఫీల్డ్',
    'action.optional': 'ఐచ్ఛికం',
  },
  
  // Additional languages with basic translations
  ta: {
    'app.title': 'நகர் ரக்ஷக்',
    'app.subtitle': 'உங்கள் குரல், உங்கள் நகரின் எதிர்காலம்',
    'nav.login': 'தொலைபேசியில் உள்நுழையவும்',
    'nav.signup': 'புதிய குடிமகன் பதிவு',
    'nav.admin': 'நிர்வாக போர்டல்',
    'dashboard.registerComplaint': 'புதிய புகாரை பதிவு செய்யவும்',
    'dashboard.trackComplaint': 'புகார் நிலையை கண்காணிக்கவும்',
    'notification.title': 'அறிவிப்புகள்',
  },
  
  gu: {
    'app.title': 'નગર રક્ષક',
    'app.subtitle': 'તમારો અવાજ, તમારા શહેરનું ભવિષ્ય',
    'nav.login': 'ફોન સાથે લોગિન કરો',
    'nav.signup': 'નવું નાગરિક સાઇનઅપ',
    'nav.admin': 'એડમિન પોર્ટલ',
    'dashboard.registerComplaint': 'નવી ફરિયાદ નોંધાવો',
    'dashboard.trackComplaint': 'ફરિયાદની સ્થિતિ ટ્રેક કરો',
    'notification.title': 'સૂચનાઓ',
  },
  
  mr: {
    'app.title': 'नगर रक्षक',
    'app.subtitle': 'तुमचा आवाज, तुमच्या शहराचे भविष्य',
    'nav.login': 'फोनसह लॉगिन करा',
    'nav.signup': 'नवीन नागरिक साइनअप',
    'nav.admin': 'अॅडमिन पोर्टल',
    'dashboard.registerComplaint': 'नवीन तक्रार नोंदवा',
    'dashboard.trackComplaint': 'तक्रारीची स्थिती ट्रॅक करा',
    'notification.title': 'सूचना',
  },
  
  kn: {
    'app.title': 'ನಗರ ರಕ್ಷಕ',
    'app.subtitle': 'ನಿಮ್ಮ ಧ್ವನಿ, ನಿಮ್ಮ ನಗರದ ಭವಿಷ್ಯ',
    'nav.login': 'ಫೋನ್‌ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
    'nav.signup': 'ಹೊಸ ನಾಗರಿಕ ಸೈನ್‌ಅಪ್',
    'nav.admin': 'ಅಡ್ಮಿನ್ ಪೋರ್ಟಲ್',
    'dashboard.registerComplaint': 'ಹೊಸ ದೂರು ನೋಂದಣಿ ಮಾಡಿ',
    'dashboard.trackComplaint': 'ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    'notification.title': 'ಅಧಿಸೂಚನೆಗಳು',
  },
  
  ml: {
    'app.title': 'നഗര രക്ഷക്',
    'app.subtitle': 'നിങ്ങളുടെ ശബ്ദം, നിങ്ങളുടെ നഗരത്തിന്റെ ഭാവി',
    'nav.login': 'ഫോണിൽ ലോഗിൻ ചെയ്യുക',
    'nav.signup': 'പുതിയ പൗര സൈൻ‌അപ്പ്',
    'nav.admin': 'അഡ്‌മിൻ പോർട്ടൽ',
    'dashboard.registerComplaint': 'പുതിയ പരാതി രജിസ്റ്റർ ചെയ്യുക',
    'dashboard.trackComplaint': 'പരാതിയുടെ നില ട്രാക്ക് ചെയ്യുക',
    'notification.title': 'അറിയിപ്പുകൾ',
  },
  
  pa: {
    'app.title': 'ਨਗਰ ਰੱਖਿਅਕ',
    'app.subtitle': 'ਤੁਹਾਡੀ ਆਵਾਜ਼, ਤੁਹਾਡੇ ਸ਼ਹਿਰ ਦਾ ਭਵਿੱਖ',
    'nav.login': 'ਫੋਨ ਨਾਲ ਲੌਗਇਨ ਕਰੋ',
    'nav.signup': 'ਨਵਾਂ ਨਾਗਰਿਕ ਸਾਈਨਅੱਪ',
    'nav.admin': 'ਐਡਮਿਨ ਪੋਰਟਲ',
    'dashboard.registerComplaint': 'ਨਵੀਂ ਸ਼ਿਕਾਇਤ ਰਜਿਸਟਰ ਕਰੋ',
    'dashboard.trackComplaint': 'ਸ਼ਿਕਾਇਤ ਦੀ ਸਥਿਤੀ ਟ੍ਰੈਕ ਕਰੋ',
    'notification.title': 'ਸੂਚਨਾਵਾਂ',
  }
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('nagar-rakshak-language') as Language
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('nagar-rakshak-language', lang)
  }

  const t = (key: string): string => {
    const translation = translations[language]?.[key]
    if (!translation) {
      // Fallback to English if translation not found
      return translations.en[key] || key
    }
    return translation
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

