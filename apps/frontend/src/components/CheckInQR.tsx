import QRCode from 'react-qr-code'

const CheckInQR = ({
  checkInCode,
  size,
}: {
  checkInCode: string
  size?: number
}) => {
  return (
    <div className="bg-white p-4">
      <QRCode
        size={size || 120}
        value={`${window.location.origin}/center/verify-code?checkInCode=${checkInCode}`}
      />
    </div>
  )
}

export default CheckInQR
