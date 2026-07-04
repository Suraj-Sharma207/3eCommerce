import React, { useState, useRef } from'react';
import { Upload, X, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle, Play, ArrowRight, RefreshCw } from'lucide-react';
import Button from'../ui/Button';
import productService from'../../services/productService';
import toast from'react-hot-toast';

const BulkImportModal = ({ isOpen, onClose, onImportComplete }) => {
 const [file, setFile] = useState(null);
 const [dragOver, setDragOver] = useState(false);
 const [error, setError] = useState(null);
 const [step, setStep] = useState('upload'); // upload -> preview -> progress -> success
 const [previewData, setPreviewData] = useState(null);
 const [isLoading, setIsLoading] = useState(false);

 // Progress Tracking
 const [progress, setProgress] = useState(0); // overall percentage
 const [progressDetails, setProgressDetails] = useState({
 total: 0,
 current: 0,
 successful: 0,
 skipped: 0,
 failed: 0,
 imagesUploaded: 0,
 statusText:''
 });

 // Success Report
 const [successReport, setSuccessReport] = useState(null);

 const fileInputRef = useRef(null);
 
 // Preview filtering state
 const [previewTab, setPreviewTab] = useState('all'); // all -> valid -> invalid

 if (!isOpen) return null;

 const handleDragOver = (e) => {
 e.preventDefault();
 setDragOver(true);
 };

 const handleDragLeave = () => {
 setDragOver(false);
 };

 const handleDrop = (e) => {
 e.preventDefault();
 setDragOver(false);
 const droppedFile = e.dataTransfer.files[0];
 validateAndSetFile(droppedFile);
 };

 const handleFileChange = (e) => {
 const selectedFile = e.target.files[0];
 validateAndSetFile(selectedFile);
 };

 const validateAndSetFile = (selectedFile) => {
 if (!selectedFile) return;

 const allowedExtensions = ['.csv','.xls','.xlsx'];
 const fileName = selectedFile.name.toLowerCase();
 const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

 if (!hasAllowedExtension) {
 setError('Unsupported file type. Please upload a CSV or Excel (.xls, .xlsx) file.');
 setFile(null);
 return;
 }

 if (selectedFile.size > 10 * 1024 * 1024) {
 setError('File size exceeds the 10MB limit.');
 setFile(null);
 return;
 }

 if (fileName.endsWith('.csv')) {
 const reader = new FileReader();
 reader.onload = (e) => {
 const text = e.target.result;
 const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
 if (lines.length > 501) { // 500 rows + 1 header
 setError('Import file contains too many rows. Maximum limit is 500 rows per file.');
 setFile(null);
 } else {
 setError(null);
 setFile(selectedFile);
 }
 };
 reader.readAsText(selectedFile);
 } else {
 setError(null);
 setFile(selectedFile);
 }
 };

 const handleDownloadTemplate = async (type) => {
 try {
 if (type ==='csv') {
 await productService.downloadCsvTemplate();
 } else {
 await productService.downloadExcelTemplate();
 }
 toast.success(`${type.toUpperCase()} template downloaded.`);
 } catch (err) {
 toast.error('Failed to download template. Please try again.');
 }
 };

 const handleUploadFile = async () => {
 if (!file) return;
 setIsLoading(true);
 setError(null);
 try {
 const data = await productService.importPreview(file);
 setPreviewData(data.data);
 setStep('preview');
 } catch (err) {
 setError(err.response?.data?.message ||'Failed to parse file. Ensure headers match the template.');
 } finally {
 setIsLoading(false);
 }
 };

 const startImport = async () => {
 if (!previewData || !previewData.validRows || previewData.validRows.length === 0) return;

 setStep('progress');
 setIsLoading(true);

 const validRows = previewData.validRows;
 const totalRows = validRows.length;
 
 setProgressDetails({
 total: totalRows,
 current: 0,
 successful: 0,
 skipped: 0,
 failed: 0,
 imagesUploaded: 0,
 statusText:'Initializing import...'
 });
 setProgress(0);

 const failedRows = [...(previewData.invalidRows || [])];
 let successfulCount = 0;
 let skippedCount = 0;
 let totalImagesUploaded = 0;

 // Process rows in batches of 5 to manage database load and Cloudinary concurrency limits
 const batchSize = 5;
 
 for (let i = 0; i < totalRows; i += batchSize) {
 const batch = validRows.slice(i, i + batchSize);
 const batchPromises = batch.map(async (row) => {
 try {
 // Update status text dynamically
 setProgressDetails(prev => ({
 ...prev,
 statusText:`Processing product"${row.name || row.sku}"...`
 }));

 const response = await productService.importRow(row);
 
 if (response.data?.skipped) {
 skippedCount++;
 setProgressDetails(prev => ({
 ...prev,
 skipped: skippedCount
 }));
 } else {
 successfulCount++;
 totalImagesUploaded += response.data?.imagesUploaded || 0;
 setProgressDetails(prev => ({
 ...prev,
 successful: successfulCount,
 imagesUploaded: totalImagesUploaded
 }));
 }
 } catch (err) {
 // Log row failures for the error report
 failedRows.push({
 rowNumber: row.rowNumber || (i + validRows.indexOf(row) + 2),
 errors: [err.response?.data?.message || err.message ||'Database creation failed'],
 row
 });
 setProgressDetails(prev => ({
 ...prev,
 failed: prev.failed + 1
 }));
 }
 });

 await Promise.all(batchPromises);

 // Update progress percentage
 const currentCompleted = Math.min(i + batchSize, totalRows);
 setProgressDetails(prev => ({
 ...prev,
 current: currentCompleted
 }));
 setProgress(Math.round((currentCompleted / totalRows) * 100));
 }

 setSuccessReport({
 imported: successfulCount,
 skipped: skippedCount,
 invalid: previewData.invalidRowsCount + (totalRows - successfulCount - skippedCount),
 images: totalImagesUploaded,
 failures: failedRows
 });

 setStep('success');
 setIsLoading(false);
 onImportComplete();
 };

 const handleDownloadErrorReport = () => {
 if (!successReport || successReport.failures.length === 0) return;

 const headers ='Row,Product Name,Errors\n';
 const rows = successReport.failures.map(f => {
 const rowNum = f.rowNumber ||'';
 const name = f.row?.name || f.row?.['Product Name'] ||'';
 const errorStr =`"${f.errors.join(';')}"`;
 return`${rowNum},${name},${errorStr}`;
 }).join('\n');

 const csvContent = headers + rows;
 const blob = new Blob([csvContent], { type:'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.setAttribute('href', url);
 link.setAttribute('download','bulk_import_error_report.csv');
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const resetModal = () => {
 setFile(null);
 setError(null);
 setPreviewData(null);
 setStep('upload');
 setProgress(0);
 setSuccessReport(null);
 };

 const getCombinedPreviewRows = () => {
 if (!previewData) return [];
 const valids = (previewData.validRows || []).map(r => ({ ...r, importStatus:'valid', errors: [] }));
 const invalids = (previewData.invalidRows || []).map(r => ({ 
 ...r.row, 
 importStatus:'invalid', 
 errors: r.errors, 
 rowNumber: r.rowNumber 
 }));
 const combined = [...valids, ...invalids].sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0));
 
 if (previewTab ==='valid') return combined.filter(r => r.importStatus ==='valid');
 if (previewTab ==='invalid') return combined.filter(r => r.importStatus ==='invalid');
 return combined;
 };

 return (
 <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
 <div 
 className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-white">
 <h2 className="text-xl text-text-brand-600 font-bold">
 Bulk Product Import
 </h2>
 {!isLoading && (
 <button 
 onClick={onClose} 
 className="text-text-muted hover:text-text-primary p-1 hover:bg-border-light rounded-lg transition-colors font-medium"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>

 {/* Step: Upload File */}
 {step ==='upload' && (
 <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0">
 <p className="text-sm text-text-secondary">
 Import and create products in bulk using CSV or Excel spreadsheets. Choose your file below, review the validation preview, and run the automated upload process.
 </p>

 {/* Template download buttons */}
 <div className="flex flex-wrap gap-4">
 <Button 
 variant="outline" 
 size="sm"
 onClick={() => handleDownloadTemplate('csv')}
 className="flex items-center gap-2"
 >
 <Download className="w-4 h-4" /> Download CSV Template
 </Button>
 <Button 
 variant="outline"
 size="sm"
 onClick={() => handleDownloadTemplate('xlsx')}
 className="flex items-center gap-2"
 >
 <Download className="w-4 h-4" /> Download Excel Template
 </Button>
 </div>

 {/* Drag and Drop Zone */}
 <div 
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current.click()}
 className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all min-h-[200px]
 ${dragOver ?'border-brand-600 bg-brand-50/20' :'border-border hover:border-brand-500 hover:bg-surface-background'}
`}
 >
 <input 
 type="file" 
 ref={fileInputRef}
 onChange={handleFileChange}
 accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
 className="hidden" 
 />
 <FileSpreadsheet className="w-12 h-12 text-text-muted mb-4 stroke-1 font-medium" />
 {file ? (
 <div>
 <p className="text-text-primary mb-1">{file.name}</p>
 <p className="text-xs text-text-muted font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
 </div>
 ) : (
 <div>
 <p className="text-text-primary mb-1">Drag & Drop CSV / XLSX here</p>
 <p className="text-xs text-text-muted mb-4 font-medium">or click to browse your computer</p>
 <span className="inline-flex px-3 py-1 bg-surface-background rounded-full text-xs text-text-secondary border border-border">
 CSV, XLS, XLSX up to 10MB
 </span>
 </div>
 )}
 </div>

 {error && (
 <div className="flex gap-2 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-700 text-sm">
 <AlertCircle className="w-5 h-5 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {/* Template Columns Preview */}
 <div className="bg-surface-background rounded-xl p-4 border border-border">
 <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-medium">
 Required Template Headers
 </h4>
 <div className="flex flex-wrap gap-2">
 {[
'Product Name','Category','Brand','Price','Discount','Stock Quantity','Description', 
'Primary Image','Secondary Image','Active','Featured Product','Trending Product','Best Seller','New Arrival','Recommended'
 ].map((col) => (
 <span key={col} className="px-2 py-1 bg-white border border-border rounded text-xs font-mono text-text-primary">
 {col}
 </span>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Step: Preview Data */}
 {step ==='preview' && previewData && (
 <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0">
 {/* Overview stats & filter tabs */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
 <div className="flex gap-4">
 <div className="text-center">
 <span className="text-2xl text-brand-700">{previewData.totalRows}</span>
 <span className="text-xs text-text-muted uppercase block font-medium">Total</span>
 </div>
 <div className="text-center border-l border-border pl-4">
 <span className="text-2xl text-success-700">{previewData.validRowsCount}</span>
 <span className="text-xs text-text-muted uppercase block font-medium">Valid</span>
 </div>
 <div className="text-center border-l border-border pl-4">
 <span className="text-2xl text-danger-700">{previewData.invalidRowsCount}</span>
 <span className="text-xs text-text-muted uppercase block font-medium">Errors</span>
 </div>
 </div>

 {/* Toggle tabs */}
 <div className="flex items-center bg-surface-background p-1 rounded-xl border border-border">
 {[
 { id:'all', label:'All Rows' },
 { id:'valid', label:'Valid Only' },
 { id:'invalid', label:'Errors Only' }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setPreviewTab(tab.id)}
 className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
 previewTab === tab.id
 ?'bg-white text-text-brand-600 shadow-sm border border-border'
 :'text-text-muted hover:text-text-primary'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 {/* Preview Table */}
 <div className="flex-1 flex flex-col min-h-[300px]">
 <div className="flex-1 border border-border rounded-xl overflow-auto bg-surface-background">
 <table className="w-full text-left border-collapse text-xs">
 <thead className="sticky top-0 bg-white z-10 border-b border-border">
 <tr>
 <th className="p-3 text-text-muted font-medium">Row</th>
 <th className="p-3 text-text-muted font-medium">Product</th>
 <th className="p-3 text-text-muted font-medium">Category</th>
 <th className="p-3 text-text-muted font-medium">Brand</th>
 <th className="p-3 text-text-muted font-medium">Price</th>
 <th className="p-3 text-text-muted font-medium">Stock</th>
 <th className="p-3 text-text-muted font-medium">Active</th>
 <th className="p-3 text-text-muted font-medium">Featured</th>
 <th className="p-3 text-text-muted font-medium">Images</th>
 <th className="p-3 text-text-muted font-medium">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border bg-white">
 {getCombinedPreviewRows().map((row, idx) => {
 const name = row.name || row.Name || row['Product Name'] ||'';
 const category = row.category || row.Category ||'';
 const brand = row.brand || row.Brand ||'';
 const price = row.price || row.Price || 0;
 const stock = row.stock || row.Stock || row['Stock Quantity'] || 0;
 const active = row.active;
 const featured = row.featured;
 const imgCount = (row.primaryImage || row.PrimaryImage || row['Primary Image'] ? 1 : 0) + (row.secondaryImage || row.SecondaryImage || row['Secondary Image'] ? 1 : 0);

 return (
 <tr key={idx} className={row.importStatus ==='invalid' ?'bg-danger-50/20' :''}>
 <td className="p-3 font-mono text-text-secondary">{row.rowNumber || idx + 2}</td>
 <td className="p-3 text-text-primary">{name || <span className="text-danger-600 italic">[Missing Name]</span>}</td>
 <td className="p-3 text-text-secondary">{category}</td>
 <td className="p-3 text-text-secondary">{brand}</td>
 <td className="p-3 text-text-primary">₹{price}</td>
 <td className="p-3 text-text-secondary">{stock}</td>
 <td className="p-3 text-text-secondary">{String(active).toUpperCase()}</td>
 <td className="p-3 text-text-secondary">{String(featured).toUpperCase()}</td>
 <td className="p-3 text-text-secondary">{imgCount} Images</td>
 <td className="p-3">
 {row.importStatus ==='valid' ? (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-success-50 text-success-700 border border-success-200">
 Valid
 </span>
 ) : (
 <div className="flex flex-col gap-0.5">
 <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-xs bg-danger-50 text-danger-700 border border-danger-200">
 Invalid
 </span>
 <span className="text-[10px] text-danger-600 block mt-0.5 max-w-xs truncate" title={row.errors?.join(',')}>
 {row.errors?.join(',')}
 </span>
 </div>
 )}
 </td>
 </tr>
 );
 })}
 {getCombinedPreviewRows().length === 0 && (
 <tr>
 <td colSpan="10" className="p-8 text-center text-text-muted font-medium">
 No rows match this filter.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* Step: Progress */}
 {step ==='progress' && (
 <div className="flex-1 p-8 space-y-8 flex flex-col justify-center items-center">
 <div className="w-full max-w-md space-y-4">
 <div className="flex justify-between text-sm text-text-primary">
 <span>Importing Products...</span>
 <span>{progress}%</span>
 </div>
 <div className="w-full h-3 bg-border rounded-full overflow-hidden">
 <div 
 className="h-full bg-brand-600 rounded-full transition-all duration-300"
 style={{ width:`${progress}%` }}
 />
 </div>
 <div className="grid grid-cols-4 gap-2 text-center text-xs">
 <div className="bg-surface-background p-2 rounded border border-border">
 <div className="text-brand-600">{progressDetails.current}</div>
 <div className="text-[10px] text-text-muted mt-0.5 font-medium">Processed</div>
 </div>
 <div className="bg-success-50 p-2 rounded border border-success-100">
 <div className="text-success-600">{progressDetails.successful}</div>
 <div className="text-[10px] text-text-muted mt-0.5 font-medium">Imported</div>
 </div>
 <div className="bg-amber-50 p-2 rounded border border-amber-100">
 <div className="text-amber-600">{progressDetails.skipped}</div>
 <div className="text-[10px] text-text-muted mt-0.5 font-medium">Skipped</div>
 </div>
 <div className="bg-danger-50 p-2 rounded border border-danger-100">
 <div className="text-danger-600">{progressDetails.failed}</div>
 <div className="text-[10px] text-text-muted mt-0.5 font-medium">Failed</div>
 </div>
 </div>
 <p className="text-center text-xs text-text-muted font-medium italic animate-pulse">
 {progressDetails.statusText}
 </p>
 </div>
 </div>
 )}

 {/* Step: Success Report */}
 {step ==='success' && successReport && (
 <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-center min-h-0">
 <div className="text-center max-w-md mx-auto py-4">
 <CheckCircle2 className="w-16 h-16 text-success-600 mx-auto mb-3 stroke-1" />
 <h3 className="text-2xl text-text-primary mb-1 font-bold">Import Complete</h3>
 <p className="text-sm text-text-secondary">
 The spreadsheet data has been successfully parsed and processed through the enterprise product creation flow.
 </p>
 </div>

 <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto w-full">
 <div className="bg-success-50 border border-success-200 rounded-xl p-4 text-center">
 <div className="text-2xl text-success-700">{successReport.imported}</div>
 <div className="text-[10px] text-success-600 uppercase tracking-wider mt-1">Imported</div>
 </div>
 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
 <div className="text-2xl text-amber-700">{successReport.skipped}</div>
 <div className="text-[10px] text-amber-600 uppercase tracking-wider mt-1">Duplicates</div>
 </div>
 <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-center">
 <div className="text-2xl text-danger-700">{successReport.invalid}</div>
 <div className="text-[10px] text-danger-600 uppercase tracking-wider mt-1">Skipped</div>
 </div>
 <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
 <div className="text-2xl text-blue-700">{successReport.images}</div>
 <div className="text-[10px] text-blue-600 uppercase tracking-wider mt-1">Images</div>
 </div>
 </div>

 {successReport.failures.length > 0 && (
 <div className="max-w-xl mx-auto w-full border border-border rounded-xl p-4 bg-surface-background flex items-center justify-between gap-4 mt-2">
 <div>
 <h4 className="text-sm text-text-primary">Failed Rows Available</h4>
 <p className="text-xs text-text-muted font-medium mt-0.5">
 {successReport.failures.length} rows encountered validation errors or upload issues.
 </p>
 </div>
 <Button 
 variant="outline" 
 size="sm" 
 onClick={handleDownloadErrorReport}
 className="flex items-center gap-2"
 >
 <Download className="w-4 h-4" /> Download Error Report
 </Button>
 </div>
 )}
 </div>
 )}

 {/* Footer Actions */}
 <div className="shrink-0 px-6 py-4 border-t border-border bg-surface-background flex items-center justify-end gap-3">
 {step ==='upload' && (
 <>
 <Button variant="outline" onClick={onClose} disabled={isLoading}>
 Cancel
 </Button>
 <Button 
 onClick={handleUploadFile} 
 disabled={!file || isLoading}
 className="flex items-center gap-2"
 >
 {isLoading ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" /> Mapped & Validating...
 </>
 ) : (
 <>
 Continue <ArrowRight className="w-4 h-4" />
 </>
 )}
 </Button>
 </>
 )}

 {step ==='preview' && (
 <>
 <Button variant="outline" onClick={resetModal}>
 Back
 </Button>
 <Button 
 onClick={startImport} 
 disabled={previewData?.validRowsCount === 0}
 className="flex items-center gap-2"
 >
 <Play className="w-4 h-4" /> Import Products
 </Button>
 </>
 )}

 {step ==='progress' && (
 <p className="text-xs text-text-muted animate-pulse font-medium">
 Running background tasks... Please do not close your browser.
 </p>
 )}

 {step ==='success' && (
 <Button onClick={onClose}>
 Done
 </Button>
 )}
 </div>
 </div>
 </div>
 );
};

export default BulkImportModal;
