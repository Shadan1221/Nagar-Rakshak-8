import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Bell, CheckCircle, Clock, AlertTriangle, X } from "lucide-react"
import { supabase } from "../integrations/supabase/client"
import { useToast } from "../hooks/use-toast"
import { useLanguage } from "../contexts/LanguageContext"

interface Notification {
  id: string
  complaint_id: string
  complaint_code: string
  stage: 'confirmation' | 'acknowledgement' | 'resolution'
  message: string
  created_at: string
  is_read: boolean
}

interface NotificationSystemProps {
  userId?: string
}

const NotificationSystem = ({ userId }: NotificationSystemProps) => {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchNotifications()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchNotifications = async () => {
    try {
      // Try to fetch from database first
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId || 'anonymous')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notifications from DB:', error)
        // Fallback to mock notifications if DB fails
        const mockNotifications: Notification[] = [
          {
            id: '1',
            complaint_id: 'mock-1',
            complaint_code: 'NGR123456',
            stage: 'confirmation',
            message: t('notification.complaintRegistered').replace('{code}', 'NGR123456').replace('{type}', t('issue.streetlight')),
            created_at: new Date().toISOString(),
            is_read: false
          },
          {
            id: '2',
            complaint_id: 'mock-2',
            complaint_code: 'NGR123457',
            stage: 'acknowledgement',
            message: t('notification.complaintAcknowledged').replace('{code}', 'NGR123457'),
            created_at: new Date(Date.now() - 60000).toISOString(),
            is_read: false
          }
        ]
        
        setNotifications(mockNotifications)
        setUnreadCount(mockNotifications.filter(n => !n.is_read).length)
        return
      }

      if (dbNotifications && dbNotifications.length > 0) {
        setNotifications(dbNotifications as Notification[])
        setUnreadCount(dbNotifications.filter(n => !n.is_read).length)
      } else {
        // Show empty state
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // Try to update in database first
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error updating notification in DB:', error)
      }

      // Update local state regardless
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'confirmation':
        return <CheckCircle className="h-4 w-4 text-civic-green" />
      case 'acknowledgement':
        return <Clock className="h-4 w-4 text-civic-saffron" />
      case 'resolution':
        return <AlertTriangle className="h-4 w-4 text-civic-blue" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'confirmation':
        return 'bg-civic-green/20 text-civic-green'
      case 'acknowledgement':
        return 'bg-civic-saffron/20 text-civic-saffron'
      case 'resolution':
        return 'bg-civic-blue/20 text-civic-blue'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute top-12 right-0 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('notification.title')}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {t('notification.noNotifications')}
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                      !notification.is_read ? 'bg-civic-blue/5' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getStageIcon(notification.stage)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStageColor(notification.stage)}>
                            {t(`notification.${notification.stage}`)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {notification.complaint_code}
                          </span>
                        </div>
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NotificationSystem
