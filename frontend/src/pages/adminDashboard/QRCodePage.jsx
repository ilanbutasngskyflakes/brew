import { useContext, useRef, useEffect } from "react";
import QRCodeStyling from "qr-code-styling";
import { ShopContext } from "../../context/createShopContext";
import { FiDownload, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function QRCodePage() {
  const navigate = useNavigate();
  const { shop } = useContext(ShopContext);
  const qrRef = useRef();
  const qrInstance = useRef(null);

  const baseURL = import.meta.env.VITE_PUBLIC_ORDER_BASE_URL || "http://localhost:5173";
  const orderURL = `${baseURL}/order/${shop?.id}`;
  const brandColor = shop?.brand_color || "#073dbe";

  useEffect(() => {
    if (!shop || !qrRef.current) return;

    // Create QR code instance
    qrInstance.current = new QRCodeStyling({
      width: 256,
      height: 256,
      data: orderURL,
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23073dbe' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='60' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='central'%3E☕%3C/text%3E%3C/svg%3E",
      dotsOptions: {
        color: brandColor,
        type: "square"
      },
      cornersSquareOptions: {
        color: brandColor,
        type: "square"
      },
      cornersDotOptions: {
        color: brandColor,
        type: "dot"
      },
      backgroundOptions: {
        color: "#ffffff"
      },
      margin: 10
    });

    // Clear and append
    qrRef.current.innerHTML = "";
    qrInstance.current.append(qrRef.current);
  }, [shop, orderURL, brandColor]);

  const downloadQR = () => {
    if (qrInstance.current) {
      qrInstance.current.download({
        name: `${shop?.name}-qr-code`,
        extension: "png"
      });
    }
  };

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading shop information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-slate-900">QR Code Generator</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          {/* Shop Info */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {shop.name}
            </h2>
            <p className="text-slate-600 mb-4">{shop.receipt_header}</p>
            <a
              href={orderURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
              style={{ color: brandColor }}
            >
              {orderURL}
            </a>
          </div>

          {/* QR Code Display */}
          <div className="flex justify-center mb-8">
            <div
              ref={qrRef}
              className="inline-block p-6 bg-white border-2 rounded-lg"
              style={{ borderColor: brandColor }}
            ></div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Download the QR code below</li>
              <li>✓ Print it as a poster or table sign</li>
              <li>✓ Customers scan to access mobile ordering</li>
              <li>✓ Works from any device with camera</li>
            </ul>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadQR}
            className="w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 text-white"
            style={{
              backgroundColor: shop?.id === 2 ? "#000000" : "#073dbe"
            }}
          >
            <FiDownload size={20} />
            Download QR Code
          </button>

          {/* Info Box */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Preview Info:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-700">Shop ID</p>
                <p>{shop.id}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Brand Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-slate-300"
                    style={{ backgroundColor: brandColor }}
                  ></div>
                  <p className="font-mono">{brandColor}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            💡 Before production, update baseURL to your domain in the code
          </p>
        </div>
      </div>
    </div>
  );
}
