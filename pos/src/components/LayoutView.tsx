import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CreditCard as Edit3, Save, Grid3x3 as Grid3X3, ZoomIn, ZoomOut, RotateCcw, X, Users, Move } from 'lucide-react';
import { cn } from '../lib/utils';
import { Table } from '../lib/table-api';
import { Button } from './ui';

interface SavedTablePosition {
  x: number;
  y: number;
  shape?: 'Circle' | 'Square' | 'Rectangle';
  capacity?: number;
}

interface SavedRoomLayout {
  [tableName: string]: SavedTablePosition;
}

interface SavedLayouts {
  [roomName: string]: SavedRoomLayout;
}

interface Props {
  selectedRoom: string;
  tables: Table[];
  onBackToGrid: () => void;
}

const LayoutView: React.FC<Props> = ({ selectedRoom, tables, onBackToGrid }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  // Store positions in localStorage
  const [savedLayouts, setSavedLayouts] = useState<SavedLayouts>(() => {
    try {
      async function saveLayout(table) {
        await fetch(`/api/resource/URY Table/${table.name}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Frappe-CSRF-Token": frappe.csrf_token
          },
          body: JSON.stringify({
            layout_x: table.x,
            layout_y: table.y,
            table_shape: table.shape,
            no_of_seats: table.capacity,
            minimum_seating: table.minimumSeating
          })
        });
      }

    } catch {
      return {};
    }
  });

  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Save to local storage whenever layouts change
  useEffect(() => {
    localStorage.setItem('ury-table-layouts', JSON.stringify(savedLayouts));
  }, [savedLayouts]);

  // Merge props.tables with saved positions
  const tablesWithPosition = useMemo(() => {
    const roomLayout = savedLayouts[selectedRoom] || {};

    return tables.map((table, index) => {
      const savedPos = roomLayout[table.name];
      // If no saved pos, default to a grid layout
      const x = savedPos?.x ?? (100 + (index % 5) * 150);
      const y = savedPos?.y ?? (100 + Math.floor(index / 5) * 150);

      return {
        ...table,
        x,
        y,
        table_shape: savedPos?.shape || table.table_shape,
        no_of_seats: savedPos?.capacity || table.no_of_seats,
      };
    });
  }, [tables, savedLayouts, selectedRoom]);

  // Calculate table dimensions based on capacity and shape
  const getTableDimensions = (shape: string, capacity: number = 4) => {
    // Dynamic sizing: minimum 60px, scales up by 10px per person, max 250px
    const size = Math.max(60, Math.min(250, 60 + (capacity * 10)));

    const normalizedShape = shape?.toLowerCase() || 'rectangle';

    switch (normalizedShape) {
      case 'circle':
        return { width: size, height: size };
      case 'square':
        return { width: size, height: size };
      case 'rectangle':
      default:
        return { width: size * 1.5, height: size };
    }
  };

  // Zoom functionality
  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, prev - 0.2));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
    }
  };

  // Pan functionality
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking continuously on background or if not clicking a table
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Drag functionality
    if (!draggedTable || !isEditMode || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Calculate new position in canvas coordinates
    // We subtract panOffset and divide by zoom to get back to "world" coordinates
    const mouseX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
    const mouseY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;

    // Update local state for immediate feedback
    setSavedLayouts(prev => ({
      ...prev,
      [selectedRoom]: {
        ...(prev[selectedRoom] || {}),
        [draggedTable]: {
          x: newX,
          y: newY,
          shape: prev[selectedRoom]?.[draggedTable]?.shape,
          capacity: prev[selectedRoom]?.[draggedTable]?.capacity,
        }
      }
    }));
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggedTable(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const getTableStatusColor = (occupied: number) => {
    return occupied
      ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:shadow-md';
  };

  const handleMouseDown = (e: React.MouseEvent, table: typeof tablesWithPosition[0]) => {
    e.stopPropagation();

    setSelectedTable(table.name);

    if (!isEditMode) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseXWorld = (e.clientX - canvasRect.left - panOffset.x) / zoom;
    const mouseYWorld = (e.clientY - canvasRect.top - panOffset.y) / zoom;

    setDraggedTable(table.name);
    setDragOffset({
      x: mouseXWorld - table.x,
      y: mouseYWorld - table.y
    });
  };

  const handleShapeChange = (e: React.MouseEvent, table: typeof tablesWithPosition[0]) => {
    e.stopPropagation();
    const shapes: ('Circle' | 'Square' | 'Rectangle')[] = ['Circle', 'Square', 'Rectangle'];
    const currentShape = table.table_shape || 'Rectangle';
    // Find current shape case-insensitively
    const currentIndex = shapes.findIndex(s => s.toLowerCase() === currentShape.toLowerCase());
    const nextShape = shapes[(currentIndex + 1) % shapes.length];

    setSavedLayouts(prev => {
      const currentTableSettings = prev[selectedRoom]?.[table.name] || {};
      return {
        ...prev,
        [selectedRoom]: {
          ...(prev[selectedRoom] || {}),
          [table.name]: {
            x: table.x,
            y: table.y,
            shape: nextShape,
            capacity: currentTableSettings.capacity,
          }
        }
      }
    });
  };


  const TableShape = ({ table }: { table: typeof tablesWithPosition[0] }) => {
    const dimensions = getTableDimensions(table.table_shape, table.no_of_seats);

    const baseClasses = cn(
      'absolute border-2 flex items-center justify-center text-sm font-semibold cursor-pointer transition-all select-none',
      getTableStatusColor(table.occupied),
      isEditMode && 'hover:ring-2 hover:ring-blue-400 cursor-move',
      draggedTable === table.name && 'shadow-xl scale-105 z-20',
      selectedTable === table.name && 'ring-2 ring-blue-600 z-10'
    );

    const style = {
      left: table.x,
      top: table.y,
      width: dimensions.width,
      height: dimensions.height,
    };

    const shapeLower = table.table_shape?.toLowerCase();
    const shapeClasses = {
      circle: 'rounded-full',
      square: 'rounded-lg',
      rectangle: 'rounded-md'
    };

    const roundedClass = shapeClasses[shapeLower as keyof typeof shapeClasses] || shapeClasses.rectangle;

    return (
      <div
        className={cn(baseClasses, roundedClass)}
        style={style}
        onMouseDown={(e) => handleMouseDown(e, table)}
      >
        <div className="text-center p-1 overflow-hidden pointer-events-none">
          <div className="font-bold truncate px-1">{table.name}</div>
          <div className="text-[10px] flex items-center justify-center gap-1 opacity-80">
            <Users className="w-3 h-3" />
            {table.no_of_seats || '-'}
          </div>
        </div>
        {isEditMode && (
          <>
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
              <Move className="w-2 h-2" />
            </div>
            <div
              onMouseDown={(e) => handleShapeChange(e, table)}
              className="absolute -bottom-1 -right-1 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 rounded-full p-0.5 shadow-sm cursor-pointer z-30 pointer-events-auto"
              title="Change Shape"
            >
              <RotateCcw className="w-2 h-2" />
            </div>
          </>
        )}
      </div>
    );
  };

  const handleCapacityChange = (capacityStr: string) => {
    if (!selectedTable) return;
    const capacity = parseInt(capacityStr);
    if (isNaN(capacity) || capacity < 1 || capacity > 20) return;

    const currentTable = tablesWithPosition.find(t => t.name === selectedTable);
    if (!currentTable) return;

    setSavedLayouts(prev => {
      const currentTableSettings = prev[selectedRoom]?.[selectedTable] || {};
      return {
        ...prev,
        [selectedRoom]: {
          ...(prev[selectedRoom] || {}),
          [selectedTable]: {
            x: currentTable.x,
            y: currentTable.y,
            shape: currentTableSettings.shape, // preserve existing shape setting
            capacity: capacity
          }
        }
      }
    });
  }

  const handleDropdownShapeChange = (shape: string) => {
    if (!selectedTable) return;
    const currentTable = tablesWithPosition.find(t => t.name === selectedTable);
    if (!currentTable) return;

    setSavedLayouts(prev => {
      const currentTableSettings = prev[selectedRoom]?.[selectedTable] || {};
      return {
        ...prev,
        [selectedRoom]: {
          ...(prev[selectedRoom] || {}),
          [selectedTable]: {
            x: currentTable.x,
            y: currentTable.y,
            shape: shape as any,
            capacity: currentTableSettings.capacity
          }
        }
      }
    });
  }

  const selectedTableData = tablesWithPosition.find(t => t.name === selectedTable);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBackToGrid}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              Grid View
            </Button>
            <h2 className="text-lg font-semibold">{selectedRoom} <span className="text-gray-400 mx-2">|</span> Layout</h2>
          </div>
          {/* Add Table button removed as unsupported by backend */}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 transition-colors"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-5 h-5 text-gray-700" />
          </button>
          <div className="px-2 py-1 bg-white rounded-lg shadow-lg border border-gray-200 text-xs font-medium text-gray-600">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Edit Mode Toggle */}
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg border transition-all',
              isEditMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            )}
          >
            {isEditMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditMode ? 'Finish Editing' : 'Edit Layout'}
          </button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
          {isEditMode ? (
            <div className="bg-blue-50/90 backdrop-blur border border-blue-200 rounded-lg p-3 text-sm text-blue-800 shadow-lg">
              <div className="font-medium mb-1">Editing Layout</div>
              <div>• Drag tables to reposition</div>
              <div>• Changes autosave</div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg p-2 text-xs text-gray-500 shadow-sm">
              Use Ctrl+Scroll to zoom • Drag background to pan
            </div>
          )}
        </div>

        <div
          ref={canvasRef}
          className="w-full h-full relative bg-white overflow-hidden"
          style={{
            cursor: isPanning ? 'grabbing' : isEditMode ? 'default' : 'grab',
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          }}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Tables Container with Transform */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'top left'
            }}
          >
            {tablesWithPosition.map(table => (
              <TableShape key={table.name} table={table} />
            ))}
          </div>
        </div>
      </div>

      {/* Table Properties Panel */}
      {selectedTable && selectedTableData && (
        <div className="absolute right-4 top-20 bg-white rounded-lg shadow-lg border p-4 w-64 z-40 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold">
              {isEditMode ? 'Edit Table Settings' : 'Table Info'}
            </h4>
            <button
              onClick={() => setSelectedTable(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Table Name</label>
              <input
                type="text"
                value={selectedTableData.name}
                disabled={true}
                className="w-full px-3 py-2 border rounded-md text-sm border-gray-200 bg-gray-50 cursor-not-allowed"
                title="Table names are managed in backend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                max="20"
                value={selectedTableData.no_of_seats || 4}
                onChange={(e) => handleCapacityChange(e.target.value)}
                disabled={!isEditMode}
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm",
                  isEditMode
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                )}
                placeholder="Enter 1-20"
              />
              <p className="text-xs text-gray-500 mt-1">Valid range: 1-20 pax</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Shape</label>
              <select
                value={selectedTableData.table_shape || 'Rectangle'}
                onChange={(e) => handleDropdownShapeChange(e.target.value)}
                disabled={!isEditMode}
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm",
                  isEditMode
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                )}
              >
                <option value="Circle">Circle</option>
                <option value="Square">Square</option>
                <option value="Rectangle">Rectangle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm cursor-not-allowed capitalize">
                {selectedTableData.occupied ? 'Occupied' : 'Available'}
              </div>
            </div>

            {/* Position Information */}
            <div className="pt-3 border-t border-gray-200">
              <label className="block text-sm font-medium mb-2">Position</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">X:</span>
                  <span className="ml-1">{Math.round(selectedTableData.x)}px</span>
                </div>
                <div>
                  <span className="text-gray-500">Y:</span>
                  <span className="ml-1">{Math.round(selectedTableData.y)}px</span>
                </div>
              </div>
            </div>

            {/* Size Information */}
            <div>
              <label className="block text-sm font-medium mb-2">Size</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">W:</span>
                  <span className="ml-1">{getTableDimensions(selectedTableData.table_shape || 'Rectangle').width}px</span>
                </div>
                <div>
                  <span className="text-gray-500">H:</span>
                  <span className="ml-1">{getTableDimensions(selectedTableData.table_shape || 'Rectangle').height}px</span>
                </div>
              </div>
            </div>

            {/* Show current bill info if table is occupied */}
            {selectedTableData.latest_invoice_time && (
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-sm font-medium mb-2">Current Bill</label>
                <div className="bg-blue-50 p-3 rounded-md text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Active since:</span>
                    <span className="font-semibold">
                      {new Date(selectedTableData.latest_invoice_time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutView;