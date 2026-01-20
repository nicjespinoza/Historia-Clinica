import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Patient, InitialHistory, SubsequentConsult } from '../types';

// Extend jsPDF type for autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        lastAutoTable: { finalY: number };
    }
}

// Theme colors
const THEME_BLUE = '#083c79';
const THEME_LIGHT_BLUE = '#e8f0fe';

/**
 * Generate PDF for Initial Clinical History
 */
export const generateHistoryPDF = (patient: Patient, history: InitialHistory): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFillColor(8, 60, 121); // Theme blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Historia Clínica', 15, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${history.date} | Hora: ${history.time}`, 15, 28);
    doc.text(`ID: ${patient.id.substring(0, 8)}...`, 15, 35);

    yPos = 50;

    // Patient Info Section
    doc.setTextColor(8, 60, 121);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Paciente', 15, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const patientInfo = [
        ['Nombre', `${patient.firstName} ${patient.lastName}`],
        ['Edad', patient.ageDetails || 'No especificada'],
        ['Sexo', patient.sex],
        ['Fecha de Nacimiento', patient.birthDate],
        ['Teléfono', patient.phone],
        ['Dirección', patient.address || 'No especificada']
    ];

    doc.autoTable({
        startY: yPos,
        head: [],
        body: patientInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 130 }
        },
        margin: { left: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Motivo de Consulta
    doc.setTextColor(8, 60, 121);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. Motivo de Consulta', 15, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const motives = Object.keys(history.motives || {}).filter(k => history.motives[k]).join(', ') || history.otherMotive || 'No especificado';
    doc.text(`Motivo: ${motives}`, 15, yPos);
    yPos += 6;
    doc.text(`Tiempo de evolución: ${history.evolutionTime || 'No especificado'}`, 15, yPos);
    yPos += 10;

    // Historia de la enfermedad actual
    if (history.historyOfPresentIllness) {
        doc.setTextColor(8, 60, 121);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('II. Historia de la Enfermedad Actual', 15, yPos);
        yPos += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitHistory = doc.splitTextToSize(history.historyOfPresentIllness, pageWidth - 30);
        doc.text(splitHistory, 15, yPos);
        yPos += splitHistory.length * 5 + 10;
    }

    // Check for new page
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    // Physical Exam
    if (history.physicalExam) {
        doc.setTextColor(8, 60, 121);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('VI. Examen Físico', 15, yPos);
        yPos += 8;

        const vitalSigns = [
            ['FC', history.physicalExam.fc || '-'],
            ['FR', history.physicalExam.fr || '-'],
            ['Temp', history.physicalExam.temp || '-'],
            ['PA', history.physicalExam.pa || '-'],
            ['SatO2', history.physicalExam.sat02 || '-'],
            ['Peso', history.physicalExam.weight || '-'],
            ['Talla', history.physicalExam.height || '-'],
            ['IMC', history.physicalExam.imc || '-']
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Signo Vital', 'Valor']],
            body: vitalSigns,
            theme: 'striped',
            headStyles: { fillColor: [8, 60, 121] },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    // Diagnosis
    if (history.diagnosis) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(8, 60, 121);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnóstico', 15, yPos);
        yPos += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitDiagnosis = doc.splitTextToSize(history.diagnosis, pageWidth - 30);
        doc.text(splitDiagnosis, 15, yPos);
        yPos += splitDiagnosis.length * 5 + 10;
    }

    // Treatment Plan
    if (history.treatment) {
        if (yPos > 220) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(8, 60, 121);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('VII. Plan de Tratamiento', 15, yPos);
        yPos += 10;

        const treatmentData = [
            ['Alimentación', history.treatment.food || '-'],
            ['Medicamentos', history.treatment.meds || '-'],
            ['Exámenes', history.treatment.exams || '-'],
            ['Normas', history.treatment.norms || '-']
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Tipo', 'Indicación']],
            body: treatmentData,
            theme: 'striped',
            headStyles: { fillColor: [8, 60, 121] },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 140 }
            },
            margin: { left: 15, right: 15 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Generado el ${new Date().toLocaleDateString('es-NI')} - Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save
    const fileName = `Historia_Clinica_${patient.lastName}_${patient.firstName}_${history.date}.pdf`;
    doc.save(fileName);
};

/**
 * Generate Medical Order PDF
 */
export const generateOrderPDF = (
    patient: Patient,
    orderType: 'medical' | 'prescription' | 'labs' | 'images' | 'endoscopy',
    details: string,
    doctorName: string = 'Dr. Médico'
): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    const orderTitles = {
        medical: 'Orden Médica',
        prescription: 'Receta Médica',
        labs: 'Orden de Laboratorio',
        images: 'Orden de Imágenes',
        endoscopy: 'Orden de Endoscopía'
    };

    // Header
    doc.setFillColor(8, 60, 121);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(orderTitles[orderType], pageWidth / 2, 22, { align: 'center' });

    yPos = 50;

    // Patient Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${patient.firstName} ${patient.lastName}`, 50, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Edad:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(patient.ageDetails || 'No especificada', 50, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('es-NI'), 50, yPos);
    yPos += 15;

    // Separator line
    doc.setDrawColor(8, 60, 121);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 15;

    // Order details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicaciones:', 15, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const splitDetails = doc.splitTextToSize(details || 'Sin indicaciones específicas', pageWidth - 30);
    doc.text(splitDetails, 15, yPos);

    // Signature area
    yPos = pageHeight - 50;
    doc.setDrawColor(0, 0, 0);
    doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(doctorName, pageWidth / 2, yPos, { align: 'center' });
    doc.text('Firma y Sello', pageWidth / 2, yPos + 5, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
        `Generado el ${new Date().toLocaleDateString('es-NI')} ${new Date().toLocaleTimeString('es-NI')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
    );

    // Save
    const fileName = `${orderTitles[orderType].replace(/ /g, '_')}_${patient.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};

/**
 * Generate Consultation Cost Receipt
 */
export const generateReceiptPDF = (
    patient: Patient,
    consultDate: string,
    consultationType: string,
    cost: number,
    doctorName: string = 'Dr. Médico'
): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFillColor(8, 60, 121);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Recibo de Consulta', pageWidth / 2, 25, { align: 'center' });

    yPos = 55;

    // Receipt number
    doc.setTextColor(8, 60, 121);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Recibo No: ${Date.now().toString().slice(-8)}`, 15, yPos);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-NI')}`, pageWidth - 70, yPos);
    yPos += 20;

    // Patient details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    const receiptData = [
        ['Paciente:', `${patient.firstName} ${patient.lastName}`],
        ['Fecha de Consulta:', consultDate],
        ['Tipo de Consulta:', consultationType],
        ['', ''],
        ['TOTAL:', `$${cost.toFixed(2)}`]
    ];

    doc.autoTable({
        startY: yPos,
        head: [],
        body: receiptData,
        theme: 'plain',
        styles: { fontSize: 12, cellPadding: 5 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 120 }
        },
        margin: { left: 15 },
        didParseCell: function (data: any) {
            if (data.row.index === 4) {
                data.cell.styles.fontSize = 16;
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [8, 60, 121];
            }
        }
    });

    yPos = doc.lastAutoTable.finalY + 30;

    // Thank you message
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Gracias por su confianza.', pageWidth / 2, yPos, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
        doctorName,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
    );

    // Save
    const fileName = `Recibo_${patient.lastName}_${consultDate}.pdf`;
    doc.save(fileName);
};
