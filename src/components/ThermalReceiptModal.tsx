import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  QrCode,
  MessageCircle,
  Check,
  Phone,
  Image as ImageIcon,
  Download,
  Share2,
} from 'lucide-react';
import { Order, Tenant, Branch, Product, OrderItem } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface ThermalReceiptModalProps {
  order: Order;
  tenant: Tenant;
  branch: Branch;
  products?: Product[];
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  order,
  tenant,
  branch,
  products,
  onClose,
}) => {
  const { language, t, tCatalog } = useLanguage();
  const isAr = language === 'ar';
  const isPaid = order.status === 'PAID';

  // Extract phone number if present in order.customerPhone or order.customerName
  const initialPhone =
    order.customerPhone ||
    (order.customerName && /\d{8,}/.test(order.customerName)
      ? order.customerName.replace(/[^\d+]/g, '')
      : '');

  const [whatsappPhone, setWhatsappPhone] = useState<string>(initialPhone);
  const [invoiceBlob, setInvoiceBlob] = useState<Blob | null>(null);
  const [invoiceDataUrl, setInvoiceDataUrl] = useState<string>('');
  const [imageCopiedNotice, setImageCopiedNotice] = useState<boolean>(false);
  const waAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const getItemNames = useCallback(
    (item: OrderItem) => {
      const storedAr = item.productNameAr || item.nameAr;
      const storedEn = item.productName || item.name || '';

      const foundProd = products?.find(
        (p) => p.id === item.productId || p.name === storedEn || p.nameAr === storedAr
      );

      const arName = storedAr || foundProd?.nameAr || (storedEn ? tCatalog(storedEn) : '');
      const enName = storedEn || foundProd?.name || (storedAr ? tCatalog(storedAr) : '');

      const primary = isAr ? arName || enName : enName || arName;
      const secondary = isAr
        ? enName && enName !== arName
          ? enName
          : ''
        : arName && arName !== enName
        ? arName
        : '';

      return { primary, secondary, arName, enName };
    },
    [products, isAr, tCatalog]
  );

  // Normalize Saudi, Jordan & international phone numbers for WhatsApp links
  const normalizeWhatsAppPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('00')) return digits.slice(2);
    if (digits.startsWith('05') && digits.length === 10) return `966${digits.slice(1)}`;
    if (digits.startsWith('5') && digits.length === 9) return `966${digits}`;
    if (digits.startsWith('07') && digits.length === 10) return `962${digits.slice(1)}`;
    if (digits.startsWith('0') && digits.length >= 9) return `966${digits.slice(1)}`;
    return digits;
  };

  // Generate high-resolution PNG image of the thermal receipt using HTML5 2D Canvas
  // and upload it to /api/public/invoice-image/:orderId for WhatsApp image card attachment
  useEffect(() => {
    let isCancelled = false;

    const renderInvoiceCanvas = async () => {
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore
        }
      }

      const scale = 2; // Retina 2x resolution
      const width = 420;
      const padX = 24;
      const contentW = width - padX * 2;
      const fontStack = "'Cairo', 'Plus Jakarta Sans', Tahoma, Arial, sans-serif";

      // Calculate dynamic height based on items
      let estimatedHeight = 560;
      order.items.forEach((item) => {
        const { secondary } = getItemNames(item);
        estimatedHeight += 30;
        if (secondary) estimatedHeight += 18;
        if (item.modifiers?.length) estimatedHeight += item.modifiers.length * 18;
        if (item.notes) estimatedHeight += 18;
      });
      if (tenant?.tobaccoPermitNumber) estimatedHeight += 22;
      if (order.tableName) estimatedHeight += 22;
      if ((order.discountAmount ?? 0) > 0) estimatedHeight += 24;

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = estimatedHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(scale, scale);

      // White receipt background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, estimatedHeight);

      let y = 28;

      const drawCenteredText = (text: string, font: string, color = '#0f172a', lineHeight = 20) => {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.direction = isAr ? 'rtl' : 'ltr';
        ctx.fillText(text, width / 2, y);
        y += lineHeight;
      };

      const drawRow = (
        rightText: string,
        leftText: string,
        font = `bold 13px ${fontStack}`,
        color = '#0f172a',
        lineHeight = 22
      ) => {
        ctx.font = font;
        ctx.fillStyle = color;
        if (isAr) {
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillText(rightText, width - padX, y);
          ctx.direction = 'ltr';
          ctx.textAlign = 'left';
          ctx.fillText(leftText, padX, y);
        } else {
          ctx.direction = 'ltr';
          ctx.textAlign = 'left';
          ctx.fillText(rightText, padX, y);
          ctx.textAlign = 'right';
          ctx.fillText(leftText, width - padX, y);
        }
        y += lineHeight;
      };

      const drawDashedLine = (dash = [4, 3], color = '#94a3b8') => {
        y += 4;
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash(dash);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(padX, y);
        ctx.lineTo(width - padX, y);
        ctx.stroke();
        ctx.restore();
        y += 16;
      };

      // 1. Header
      drawCenteredText(
        (tenant?.name || 'BANLIS').toUpperCase(),
        `900 22px ${fontStack}`,
        '#0f172a',
        24
      );

      const addressLine =
        tenant?.address ||
        (branch?.address && branch.address !== 'Main Commercial Avenue' ? branch.address : '') ||
        branch?.address ||
        (isAr ? 'الرياض - حي الملك' : 'Riyadh');
      drawCenteredText(addressLine, `bold 13px ${fontStack}`, '#1e293b', 20);

      if (branch?.phone) {
        drawCenteredText(
          `${isAr ? 'هاتف:' : 'Tel:'} ${branch.phone}`,
          `bold 13px ${fontStack}`,
          '#1e293b',
          20
        );
      }

      drawCenteredText(
        isAr
          ? `السجل التجاري: Cr-No: ${tenant?.crNumber || '703508276'}`
          : `Cr-No: ${tenant?.crNumber || '703508276'}`,
        `bold 12px ${fontStack}`,
        '#0f172a',
        19
      );

      drawCenteredText(
        isAr
          ? `الرقم الضريبي: Tax No: ${tenant?.taxNumber || '311755085300003'}`
          : `Tax No: ${tenant?.taxNumber || '311755085300003'}`,
        `bold 12px ${fontStack}`,
        '#0f172a',
        19
      );

      if (tenant?.tobaccoPermitNumber) {
        drawCenteredText(
          isAr
            ? `تصريح بيع التبغ ${tenant.tobaccoPermitNumber}`
            : `Tobacco Permit: ${tenant.tobaccoPermitNumber}`,
          `bold 12px ${fontStack}`,
          '#0f172a',
          20
        );
      }

      // Invoice Type Box
      y += 2;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(padX, y - 14, contentW, 28);
      drawCenteredText(
        isPaid
          ? isAr
            ? 'فاتورة ضريبية مبسطة'
            : 'SIMPLIFIED TAX INVOICE'
          : isAr
          ? 'كشف حساب العميل (غير مدفوع)'
          : 'CUSTOMER CHECK (UNPAID)',
        `900 13px ${fontStack}`,
        '#0f172a',
        24
      );

      drawDashedLine();

      // 2. Order Metadata
      drawRow(isAr ? 'رقم الطلب:' : 'Order #:', order.orderNumber, `900 13px ${fontStack}`);
      drawRow(
        isAr ? 'التاريخ والوقت:' : 'Date & Time:',
        new Date(order.createdAt).toLocaleString(),
        `bold 12px ${fontStack}`
      );
      const orderTypeLabel =
        order.type === 'DINE_IN'
          ? isAr
            ? 'محلي'
            : 'Dine-In'
          : order.type === 'TAKEAWAY'
          ? isAr
            ? 'سفري'
            : 'Takeaway'
          : order.type === 'DELIVERY'
          ? isAr
            ? 'توصيل'
            : 'Delivery'
          : order.type;
      drawRow(isAr ? 'نوع الطلب:' : 'Order Type:', orderTypeLabel);
      if (order.tableName) {
        drawRow(isAr ? 'الطاولة / القسم:' : 'Table / Section:', order.tableName);
      }
      drawRow(
        isAr ? 'الكاشير / الخادم:' : 'Server / Cashier:',
        order.waiterName || order.cashierName || (isAr ? 'الموظف' : 'Staff')
      );

      drawDashedLine();

      // 3. Items Table Header
      ctx.font = `900 12px ${fontStack}`;
      ctx.fillStyle = '#0f172a';
      if (isAr) {
        ctx.textAlign = 'right';
        ctx.fillText('الصنف', width - padX, y);
        ctx.textAlign = 'center';
        ctx.fillText('الكمية', width / 2, y);
        ctx.textAlign = 'left';
        ctx.fillText('الإجمالي', padX, y);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText('Item', padX, y);
        ctx.textAlign = 'center';
        ctx.fillText('Qty', width / 2, y);
        ctx.textAlign = 'right';
        ctx.fillText('Total', width - padX, y);
      }
      y += 8;
      drawDashedLine([2, 2], '#cbd5e1');

      // 4. Items List
      order.items.forEach((item) => {
        const { primary, secondary } = getItemNames(item);
        const lineTotal = `${((item.unitPrice ?? 0) * (item.quantity ?? 1)).toFixed(2)} ${
          tenant.currency
        }`;

        ctx.font = `900 13px ${fontStack}`;
        ctx.fillStyle = '#0f172a';
        if (isAr) {
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillText(primary || 'صنف', width - padX, y);
          ctx.textAlign = 'center';
          ctx.fillText(String(item.quantity), width / 2, y);
          ctx.direction = 'ltr';
          ctx.textAlign = 'left';
          ctx.fillText(lineTotal, padX, y);
        } else {
          ctx.direction = 'ltr';
          ctx.textAlign = 'left';
          ctx.fillText(primary || 'Item', padX, y);
          ctx.textAlign = 'center';
          ctx.fillText(String(item.quantity), width / 2, y);
          ctx.textAlign = 'right';
          ctx.fillText(lineTotal, width - padX, y);
        }
        y += 18;

        if (secondary) {
          ctx.font = `bold 11px ${fontStack}`;
          ctx.fillStyle = '#334155';
          if (isAr) {
            ctx.textAlign = 'right';
            ctx.fillText(secondary, width - padX, y);
          } else {
            ctx.textAlign = 'left';
            ctx.fillText(secondary, padX, y);
          }
          y += 16;
        }

        if (item.modifiers && item.modifiers.length > 0) {
          ctx.font = `bold 11px ${fontStack}`;
          ctx.fillStyle = '#334155';
          item.modifiers.forEach((m) => {
            const modText = `+ ${m.nameAr || m.name}${m.price ? ` (+${m.price})` : ''}`;
            if (isAr) {
              ctx.textAlign = 'right';
              ctx.fillText(modText, width - padX - 8, y);
            } else {
              ctx.textAlign = 'left';
              ctx.fillText(modText, padX + 8, y);
            }
            y += 16;
          });
        }

        if (item.notes) {
          ctx.font = `italic bold 11px ${fontStack}`;
          ctx.fillStyle = '#334155';
          const noteText = `${isAr ? 'ملاحظة:' : 'Note:'} ${item.notes}`;
          if (isAr) {
            ctx.textAlign = 'right';
            ctx.fillText(noteText, width - padX - 8, y);
          } else {
            ctx.textAlign = 'left';
            ctx.fillText(noteText, padX + 8, y);
          }
          y += 16;
        }
        y += 4;
      });

      drawDashedLine();

      // 5. Totals
      drawRow(
        isAr ? 'المجموع الفرعي:' : 'Subtotal:',
        `${(order.subtotal ?? 0).toFixed(2)} ${tenant.currency}`
      );

      if ((order.discountAmount ?? 0) > 0) {
        const discPct =
          (order.subtotal ?? 0) > 0
            ? ` (${Number((((order.discountAmount ?? 0) / order.subtotal) * 100).toFixed(1))}%)`
            : '';
        drawRow(
          `${isAr ? 'الخصم المطبق' : 'Discount Applied'}${discPct}:`,
          `-${(order.discountAmount ?? 0).toFixed(2)} ${tenant.currency}`,
          `bold 13px ${fontStack}`,
          '#065f46'
        );
      }

      drawRow(
        `${tenant.taxName || (isAr ? 'ضريبة القيمة المضافة' : 'VAT')} (${tenant.taxRatePct}%):`,
        `${(order.taxAmount ?? 0).toFixed(2)} ${tenant.currency}`
      );

      // Solid line before Total Due
      ctx.beginPath();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.moveTo(padX, y - 8);
      ctx.lineTo(width - padX, y - 8);
      ctx.stroke();
      y += 10;

      drawRow(
        isAr ? 'المبلغ الإجمالي:' : 'TOTAL DUE:',
        `${(order.total ?? 0).toFixed(2)} ${tenant.currency}`,
        `900 16px ${fontStack}`,
        '#0f172a',
        26
      );

      const paymentStatusText = isPaid
        ? isAr
          ? `مدفوع عبر ${
              order.paymentMethod === 'CASH'
                ? 'نقداً'
                : order.paymentMethod === 'CARD'
                ? 'بطاقة مدى / ائتمان'
                : order.paymentMethod
            }`
          : `PAID VIA ${order.paymentMethod || 'CASH'}`
        : isAr
        ? 'غير مدفوع (تم طلب الفاتورة)'
        : 'UNPAID (BILL REQUESTED)';

      drawRow(
        isAr ? 'حالة الدفع:' : 'Payment Status:',
        paymentStatusText,
        `bold 12px ${fontStack}`,
        '#0f172a',
        22
      );

      drawDashedLine();

      // 6. ZATCA QR Box & Footer
      const qrSize = 76;
      const qrX = (width - qrSize) / 2;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX - 6, y - 4, qrSize + 12, qrSize + 12);

      ctx.fillStyle = '#0f172a';
      const cells = 11;
      const cellS = qrSize / cells;
      const drawFinder = (fx: number, fy: number) => {
        ctx.fillRect(fx, fy, cellS * 3, cellS * 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx + cellS * 0.5, fy + cellS * 0.5, cellS * 2, cellS * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx + cellS, fy + cellS, cellS, cellS);
      };
      drawFinder(qrX, y);
      drawFinder(qrX + cellS * (cells - 3), y);
      drawFinder(qrX, y + cellS * (cells - 3));
      for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
          const inFinder =
            (r < 4 && c < 4) || (r < 4 && c >= cells - 4) || (r >= cells - 4 && c < 4);
          if (!inFinder && (r * 7 + c * 13 + order.orderNumber.length) % 3 === 0) {
            ctx.fillRect(qrX + c * cellS, y + r * cellS, cellS * 0.85, cellS * 0.85);
          }
        }
      }
      y += qrSize + 26;

      drawCenteredText(
        'ZATCA E-INVOICE TLV VERIFIED',
        `bold 10px ${fontStack}`,
        '#334155',
        18
      );
      drawCenteredText(
        `${tenant?.name || 'BANLIS'} — ${isAr ? 'شكراً لزيارتكم' : 'Thank you for your visit!'}`,
        `900 12px ${fontStack}`,
        '#0f172a',
        20
      );

      // Crop canvas to exact used height
      const finalHeight = y + 12;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width * scale;
      finalCanvas.height = finalHeight * scale;
      const finalCtx = finalCanvas.getContext('2d');
      if (finalCtx) {
        finalCtx.drawImage(canvas, 0, 0);
      }

      if (isCancelled) return;
      const dataUrl = finalCanvas.toDataURL('image/png');
      setInvoiceDataUrl(dataUrl);

      // Upload PNG to backend cache so /invoice/:orderId & /api/public/invoice-image/:orderId.png work immediately
      fetch(`/api/public/invoice-image/${encodeURIComponent(order.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      }).catch(() => {});

      finalCanvas.toBlob((blob) => {
        if (!isCancelled && blob) {
          setInvoiceBlob(blob);
        }
      }, 'image/png');
    };

    renderInvoiceCanvas();

    return () => {
      isCancelled = true;
    };
  }, [order, tenant, branch, isAr, isPaid, getItemNames]);

  const formattedPhone = normalizeWhatsAppPhone(whatsappPhone);
  const publicInvoiceImageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invoice/${encodeURIComponent(order.id)}`
      : '';

  // WhatsApp URL includes ONLY the visual Invoice Image Card link (OpenGraph image preview, zero text breakdown)
  const whatsappChatUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(publicInvoiceImageUrl)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(publicInvoiceImageUrl)}`;

  // 1. Copy PNG image while document is still focused, then open WhatsApp!
  const handleSendWhatsAppImage = async () => {
    // First: write the actual PNG image to system clipboard while window is STILL focused!
    if (invoiceBlob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': invoiceBlob,
          }),
        ]);
        setImageCopiedNotice(true);
        setTimeout(() => setImageCopiedNotice(false), 8000);
      } catch {
        // Ignore if inside restricted iframe
      }
    }

    // Also make sure server has the PNG cached
    if (invoiceDataUrl) {
      try {
        await fetch(`/api/public/invoice-image/${encodeURIComponent(order.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: invoiceDataUrl }),
        });
      } catch {
        // Ignore network error
      }
    }

    // Now trigger the hidden <a target="_blank"> to open WhatsApp with the visual invoice image card
    if (waAnchorRef.current) {
      waAnchorRef.current.click();
    }
  };

  // Native Web Share API for mobile/tablets/Windows (attaches actual PNG file directly to WhatsApp app)
  const handleNativeShareImage = async () => {
    if (!invoiceBlob) return;
    const fileName = `Invoice-${order.orderNumber.replace('#', '')}.png`;
    const file = new File([invoiceBlob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${tenant?.name || 'BANLIS'} - ${order.orderNumber}`,
        });
        return;
      } catch {
        // Fallback if user cancelled
      }
    }
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': invoiceBlob,
          }),
        ]);
        setImageCopiedNotice(true);
        setTimeout(() => setImageCopiedNotice(false), 6000);
      } catch {
        // Fallback download
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReceiptBody = () => (
    <div className="font-sans text-xs text-slate-950 space-y-2.5">
      {/* Header & Logo Banner */}
      <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
        <h2 className="text-base font-black tracking-tight text-slate-950 uppercase font-sans">
          {tenant?.name || 'Restaurant'}
        </h2>
        <p className="text-[11px] font-bold text-slate-900">
          {tenant?.address ||
            (branch?.address && branch.address !== 'Main Commercial Avenue' ? branch.address : '') ||
            branch?.address ||
            (isAr ? 'الرياض - حي الملك ع - طريق' : 'Riyadh - Main Street')}
        </p>
        {branch?.phone && (
          <p className="text-[11px] font-bold text-slate-900">
            {isAr ? 'هاتف:' : 'Tel:'} <span dir="ltr">{branch.phone}</span>
          </p>
        )}

        {/* Cr-No: السجل التجاري */}
        <p className="text-[11px] font-bold text-slate-950 mt-1">
          {isAr
            ? `السجل التجاري: Cr-No: ${tenant?.crNumber || '703508276'}`
            : `Cr-No: ${tenant?.crNumber || '703508276'}`}
        </p>

        {/* Tax No: الرقم الضريبي */}
        <p className="text-[11px] font-bold text-slate-950">
          {isAr
            ? `الرقم الضريبي: Tax No: ${tenant?.taxNumber || '311755085300003'}`
            : `Tax No: ${tenant?.taxNumber || '311755085300003'}`}
        </p>

        {/* Tobacco Permit Number (if configured) */}
        {tenant?.tobaccoPermitNumber && (
          <p className="text-[11px] font-bold text-slate-950">
            {isAr
              ? `تصريح بيع التبغ ${tenant.tobaccoPermitNumber}`
              : `Tobacco Permit: ${tenant.tobaccoPermitNumber}`}
          </p>
        )}

        <div className="mt-1.5 py-1 px-2 rounded border border-slate-900 text-slate-950 font-black text-xs uppercase">
          {isPaid
            ? isAr
              ? 'فاتورة ضريبية مبسطة'
              : 'SIMPLIFIED TAX INVOICE'
            : isAr
            ? 'كشف حساب العميل (غير مدفوع)'
            : 'CUSTOMER CHECK (UNPAID)'}
        </div>
      </div>

      {/* Order Metadata */}
      <div className="space-y-1 text-[11px] font-bold text-slate-950">
        <div className="flex justify-between items-baseline gap-2">
          <span className="shrink-0">{isAr ? 'رقم الطلب:' : 'Order #:'}</span>
          <span className="font-black text-xs text-slate-950" dir="ltr">
            {order.orderNumber}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="shrink-0">{isAr ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
          <span className="text-[10px]" dir="ltr">
            {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <span className="shrink-0">{isAr ? 'نوع الطلب:' : 'Order Type:'}</span>
          <span className="uppercase font-extrabold">
            {order.type === 'DINE_IN'
              ? isAr
                ? 'محلي'
                : 'Dine-In'
              : order.type === 'TAKEAWAY'
              ? isAr
                ? 'سفري'
                : 'Takeaway'
              : order.type === 'DELIVERY'
              ? isAr
                ? 'توصيل'
                : 'Delivery'
              : order.type}
          </span>
        </div>
        {order.tableName && (
          <div className="flex justify-between items-baseline gap-2">
            <span className="shrink-0">{isAr ? 'الطاولة / القسم:' : 'Table / Section:'}</span>
            <span className="font-black text-slate-950 px-1.5 py-0.5 rounded" dir="ltr">
              {order.tableName}
            </span>
          </div>
        )}
        <div className="flex justify-between items-baseline gap-2">
          <span className="shrink-0">{isAr ? 'الكاشير / الخادم:' : 'Server / Cashier:'}</span>
          <span className="truncate max-w-[130px]" dir="ltr">
            {order.waiterName || order.cashierName || (isAr ? 'الموظف' : 'Staff')}
          </span>
        </div>
      </div>

      {/* Itemized Order Table */}
      <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1.5">
        <div className="flex justify-between items-center font-black text-[11px] uppercase text-slate-950 border-b border-dotted border-slate-300 pb-1">
          <span className="w-[48%] ltr:text-left rtl:text-right">{isAr ? 'الصنف' : 'Item'}</span>
          <span className="w-[18%] text-center">{isAr ? 'الكمية' : 'Qty'}</span>
          <span className="w-[34%] ltr:text-right rtl:text-left">{isAr ? 'الإجمالي' : 'Total'}</span>
        </div>
        {order.items.map((item, idx) => {
          const { primary, secondary } = getItemNames(item);
          return (
            <div key={idx} className="space-y-0.5 py-0.5">
              <div className="flex justify-between items-start text-[11px] gap-1">
                <div className="w-[48%] flex flex-col ltr:text-left rtl:text-right overflow-hidden">
                  <span className="font-black text-slate-950 leading-snug break-words">
                    {primary || (isAr ? 'صنف' : 'Item')}
                  </span>
                  {secondary && (
                    <span
                      className="text-[10px] text-slate-800 font-bold leading-tight mt-0.5 break-words"
                      dir="ltr"
                    >
                      {secondary}
                    </span>
                  )}
                </div>
                <span className="w-[18%] text-center font-black text-slate-950">
                  {item.quantity}
                </span>
                <span
                  className="w-[34%] ltr:text-right rtl:text-left font-black text-slate-950 whitespace-nowrap"
                  dir="ltr"
                >
                  {((item.unitPrice ?? 0) * (item.quantity ?? 1)).toFixed(2)} {tenant.currency}
                </span>
              </div>
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="ltr:pl-2 rtl:pr-2 text-[10px] text-slate-900 font-bold">
                  {item.modifiers.map((m, mIdx) => (
                    <div key={mIdx} className="flex justify-between">
                      <span>+ {m.nameAr || m.name}</span>
                      {(m.price ?? 0) > 0 && <span dir="ltr">+{m.price}</span>}
                    </div>
                  ))}
                </div>
              )}
              {item.notes && (
                <div className="ltr:pl-2 rtl:pr-2 text-[10px] text-slate-900 font-bold italic">
                  {isAr ? 'ملاحظة:' : 'Note:'} {item.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtotal, Tax & Total Summary */}
      <div className="space-y-1 text-[11px] pt-1 font-bold text-slate-950">
        <div className="flex justify-between items-baseline gap-2">
          <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
          <span className="font-extrabold whitespace-nowrap" dir="ltr">
            {(order.subtotal ?? 0).toFixed(2)} {tenant.currency}
          </span>
        </div>
        {(order.discountAmount ?? 0) > 0 && (
          <div className="flex justify-between items-baseline gap-2 text-emerald-800 font-bold">
            <span>
              {isAr ? 'الخصم المطبق' : 'Discount Applied'}{' '}
              {(order.subtotal ?? 0) > 0
                ? `(${Number((((order.discountAmount ?? 0) / order.subtotal) * 100).toFixed(1))}%)`
                : ''}
              :
            </span>
            <span className="whitespace-nowrap" dir="ltr">
              -{(order.discountAmount ?? 0).toFixed(2)} {tenant.currency}
            </span>
          </div>
        )}
        <div className="flex justify-between items-baseline gap-2">
          <span>
            {tenant.taxName || (isAr ? 'ضريبة القيمة المضافة' : 'VAT')} ({tenant.taxRatePct}%):
          </span>
          <span className="font-extrabold whitespace-nowrap" dir="ltr">
            {(order.taxAmount ?? 0).toFixed(2)} {tenant.currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2 text-sm font-black border-t border-slate-900 pt-1.5 text-slate-950">
          <span>{isAr ? 'المبلغ الإجمالي:' : 'TOTAL DUE:'}</span>
          <span className="font-black whitespace-nowrap" dir="ltr">
            {(order.total ?? 0).toFixed(2)} {tenant.currency}
          </span>
        </div>
        <div className="flex justify-between items-baseline gap-2 text-[10.5px] text-slate-900 pt-1">
          <span className="shrink-0">{isAr ? 'حالة الدفع:' : 'Payment Status:'}</span>
          <span className="font-extrabold uppercase">
            {isPaid
              ? isAr
                ? `مدفوع عبر ${
                    order.paymentMethod === 'CASH'
                      ? 'نقداً'
                      : order.paymentMethod === 'CARD'
                      ? 'بطاقة مدى / ائتمان'
                      : order.paymentMethod
                  }`
                : `PAID VIA ${order.paymentMethod || 'CASH'}`
              : isAr
              ? 'غير مدفوع (تم طلب الفاتورة)'
              : 'UNPAID (BILL REQUESTED)'}
          </span>
        </div>
      </div>

      {/* ZATCA QR & Footer */}
      <div className="border-t border-dashed border-slate-400 pt-2.5 flex flex-col items-center justify-center text-center space-y-1">
        <div className="w-20 h-20 p-1.5 bg-white rounded-lg border border-slate-400 flex items-center justify-center">
          <QrCode className="w-16 h-16 text-slate-950" />
        </div>
        <p className="text-[9px] text-slate-900 font-bold uppercase tracking-wider font-sans">
          ZATCA e-Invoice TLV Verified
        </p>
        <p className="text-[10px] text-slate-950 font-extrabold font-sans">
          {tenant?.name || 'Restaurant'} — {isAr ? 'شكراً لزيارتكم' : 'Thank you for your visit!'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Hidden anchor triggered AFTER clipboard write succeeds */}
      <a
        ref={waAnchorRef}
        href={whatsappChatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in print:hidden">
        <div className="relative w-full max-w-sm rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
          {/* Modal Actions Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                {isPaid
                  ? t('receipt.paidReceipt', 'فاتورة ضريبية مبسطة')
                  : t('receipt.customerCheck', 'كشف حساب العميل / الحساب التقريبي')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSendWhatsAppImage}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow"
                title={isAr ? 'إرسال الفاتورة كصورة عبر واتساب' : 'Send Invoice Image via WhatsApp'}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'صورة واتساب' : 'WA Image'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                {t('common.print', 'طباعة')}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Screen Preview Receipt Canvas */}
          <div className="p-5 overflow-y-auto flex-1">{renderReceiptBody()}</div>

          {/* WhatsApp Image Share Section + Modal Footer Controls */}
          <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-2 shrink-0">
            {imageCopiedNotice && (
              <div className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-2 shadow animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? 'تم إرفاق رابط بطاقة الفاتورة المصورة ونسخ ملف الصورة! يمكنك الإرسال مباشرة أو الضغط على (Ctrl+V / لصق) داخل واتساب لإرفاق الصورة مباشرة.'
                    : 'Invoice image card attached & PNG copied! Send directly or press (Ctrl+V / Paste) inside WhatsApp.'}
                </span>
              </div>
            )}

            {/* WhatsApp Phone Input & Image Action Row */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  dir="ltr"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder={isAr ? '05XXXXXXXX / +962...' : '05XXXXXXXX (Customer WhatsApp)'}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSendWhatsAppImage}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isAr ? 'إرسال كصورة واتساب' : 'Send Image WA'}</span>
              </button>
              <button
                type="button"
                onClick={handleNativeShareImage}
                className="p-1.5 bg-white hover:bg-slate-200 text-emerald-700 border border-slate-300 rounded-xl transition shrink-0"
                title={isAr ? 'مشاركة / نسخ ملف الصورة مباشرة' : 'Share / Copy Image File'}
              >
                {imageCopiedNotice ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
              {invoiceDataUrl && (
                <a
                  href={invoiceDataUrl}
                  download={`Invoice-${order.orderNumber.replace('#', '')}.png`}
                  className="p-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition shrink-0"
                  title={isAr ? 'تنزيل صورة الفاتورة (PNG)' : 'Download Invoice Image (PNG)'}
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Print & Close Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>
                  {isAr ? 'طباعة الفاتورة / الحساب' : t('common.print', 'Print Bill / Invoice')}
                </span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                {t('common.close', 'إغلاق')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top-level Print Portal directly under document.body — never clipped by overflow-hidden or backdrop-blur */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="pos-print-root" dir={isAr ? 'rtl' : 'ltr'}>
            {renderReceiptBody()}
          </div>,
          document.body
        )}
    </>
  );
};
