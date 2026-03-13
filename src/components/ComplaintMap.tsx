import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Complaint {
  id: string
  complaint_code: string
  issue_type: string
  city: string
  state: string
  gps_latitude: number
  gps_longitude: number
  status: string
  created_at: string
}

interface ComplaintMapProps {
  complaints: Complaint[]
}

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const ComplaintMap = ({ complaints }: ComplaintMapProps) => {
  if (complaints.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No complaints with GPS coordinates found
      </div>
    )
  }

  // Calculate center point from all complaints
  const centerLat = complaints.reduce((sum, c) => sum + c.gps_latitude, 0) / complaints.length
  const centerLng = complaints.reduce((sum, c) => sum + c.gps_longitude, 0) / complaints.length

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return '#16a34a' // green
      case 'assigned': 
      case 'in-progress': return '#f59e0b' // orange
      case 'registered': return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {complaints.map((complaint) => (
          <Marker
            key={complaint.id}
            position={[complaint.gps_latitude, complaint.gps_longitude]}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{complaint.issue_type}</h4>
                  <span 
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: getStatusColor(complaint.status) }}
                  >
                    {complaint.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>ID:</strong> {complaint.complaint_code}
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>Location:</strong> {complaint.city}, {complaint.state}
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>Coordinates:</strong> {complaint.gps_latitude.toFixed(4)}, {complaint.gps_longitude.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Reported:</strong> {new Date(complaint.created_at).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default ComplaintMap
