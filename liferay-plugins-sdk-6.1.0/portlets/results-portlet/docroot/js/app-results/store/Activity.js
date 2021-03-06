/**
 * The store used for summits
 */
Ext.define('RS.store.Activity', {
	extend: 'Ext.data.BufferedStore',
  requires: [
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.grid.plugin.BufferedRenderer',
    'RS.model.Activity'
  ],

  model: 'RS.model.Activity',
  alias: 'store.activity',
  storeId: 'activityStore',

  // allow the grid to interact with the paging scroller by buffering
  
  leadingBufferZone: 30,
  pageSize: 300
});