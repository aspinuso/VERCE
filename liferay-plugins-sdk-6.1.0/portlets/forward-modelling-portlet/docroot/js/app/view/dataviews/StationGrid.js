/**
 * The grid in which summits are displayed
 * @extends Ext.grid.Panel
 */
 
 
Ext.define('CF.view.dataviews.StationGrid' ,{
    extend: 'Ext.grid.Panel',
    alias : 'widget.stationsgrid',
    requires: [
    	'CF.store.StationStore',
        'GeoExt.selection.FeatureModel',
        'GeoExt.grid.column.Symbolizer',
        'Ext.grid.plugin.CellEditing',
        'Ext.grid.plugin.BufferedRenderer',
        'Ext.form.field.Number'
    ],
   
    initComponent: function() {
        Ext.apply(this, {
        	id: 'gridStations',
            border: false,
            store:stationStore,
            //selType: 'checkboxmodel',
            selModel: Ext.create('Ext.selection.CheckboxModel', {checkOnly: true}),            
            columns: [
                {
                    header: '',
                    dataIndex: 'symbolizer',
                    menuDisabled: true,
                    sortable: false,
                    xtype: 'gx_symbolizercolumn',
                    width: 30
                },
                
                {header: 'Station', dataIndex: 'station', flex: 3},
                {header: 'Network', dataIndex: 'network', flex: 3},
                 
                {header: 'Elevation',dataIndex: 'elevation',flex: 3},
                {header: 'Latitude', dataIndex: 'latitude', flex: 3},
                {header: 'Longitude', dataIndex: 'longitude', flex: 3},
                {
         		   xtype:'actioncolumn', 
       			   width:40,
		           tdCls:'delete',
 		            items: [{
 		            	icon: localResourcesPath+'/img/eye-3-256.png', // Use a URL in the icon config
 		            	tooltip: 'Show',
 		            	handler: function(grid, rowIndex, colIndex)
 		            	{
 		            		var rec = grid.getStore().getAt(rowIndex);
			                showStationInfo(rec.raw);
 		            	}
 		            }]
                }],
            flex: 1
        });
        this.callParent(arguments);   
    },
});