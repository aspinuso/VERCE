from dispel4py.workflow_graph import WorkflowGraph
from dispel4py.visualisation import *
from dispel4py.seismo.seismo import *
from postproc import ReadJSON, WatchDirectory
from specfem3d2stream import Specfem3d2Stream
from wavePlot_INGV import WavePlot_INGV
from streamToSeedFile import StreamToSeedFile
from kmlGenerator_INGV import kmlGenerator_INGV
from dispel4py.seismo import seismo
from dispel4py.seismo.obspy_stream import createProcessingComposite, INPUT_NAME, OUTPUT_NAME
import json
import os
import sys


input_json=json.load(open(os.environ["INPUT_FILE"]))

def myCustom(self,data):
    return str(data)

#dispel4py.seismo.seismo.SeismoPE.extractItemMetadata=myCustom

class ReadJSON(GenericPE):
    OUTPUT_NAME='output'
     
    
    def __init__(self):
        GenericPE.__init__(self)
        self.outputconnections = { ReadJSON.OUTPUT_NAME : { NAME : ReadJSON.OUTPUT_NAME } }
        
    def _process(self, inputs):
        
        self.write(ReadJSON.OUTPUT_NAME, input_json)

graph = WorkflowGraph()
read = ReadJSON()
watcher = WatchDirectory()

waveplot = WavePlot_INGV()
specfem2stream = Specfem3d2Stream()
seedtostream=StreamToSeedFile()
#kmlGenerator = kmlGenerator_INGV()

#os.environ['EVENT_PATH']='./'

controlInput = json.load(open(os.environ['JSON_OUT']+"/jsonout_run_specfem"))


#kmlGenerator.appParameters={"stations_file":os.environ['RUN_PATH']+'/stations'}
solver_name=""
if "SOLVER_NAME" in os.environ:
        solver_name=os.environ["SOLVER_NAME"]

specfem2stream.parameters={"stations_file":os.environ['RUN_PATH']+'/stations', "solver_name":solver_name}
#specfem2stream.parameters={"stations_file":os.environ['RUN_PATH']+'/stations'}
#specfem2stream.controlParameters = { 'outputdest' : "./" ,'runId' : controlInput["metadata"]["runId"], 'username' : controlInput["metadata"]["username"] }

waveplot.parameters = { 'filedestination' : '/OUTPUT_FILES/TRANSFORMED/PLOT/' }
#waveplot.controlParameters = {'outputdest' : os.environ['EVENT_PATH'], 'runId' : controlInput["metadata"]["runId"], 'username' : controlInput["metadata"]["username"] }

seedtostream.parameters = { 'filedestination' : '/OUTPUT_FILES/TRANSFORMED/SEED/' }
#seedtostream.controlParameters =
#seedtostream.outputdest=os.environ['EVENT_PATH']
#seedtostream.runId=controlInput["metadata"]["runId"]
#seedtostream.username=controlInput["metadata"]["username"]


#waveplot.outputdest=os.environ['EVENT_PATH']
#waveplot.runId=controlInput["metadata"]["runId"]
#waveplot.username=controlInput["metadata"]["username"]

#specfem2stream.outputdest=os.environ['EVENT_PATH']
#print("DADADADAD "+specfem2stream.outputdest)
#specfem2stream.runId=controlInput["metadata"]["runId"]
#specfem2stream.username=controlInput["metadata"]["username"]

#watcher.controlParameters = { 'outputdest' : os.environ['EVENT_PATH'], 'runId' : controlInput["metadata"]["runId"], 'username' : controlInput["metadata"]["username"] }
#watcher.outputdest=os.environ['EVENT_PATH']
#watcher.runId=controlInput["metadata"]["runId"]
#watcher.username=controlInput["metadata"]["username"]




graph.connect(read, ReadJSON.OUTPUT_NAME, watcher, "input")
graph.connect(watcher, "output", specfem2stream, "input")
graph.connect(seedtostream, "output", waveplot, "input")
graph.connect(specfem2stream, "output", seedtostream, "input")

#graph=attachProvenancePE(graph,ProvenanceRecorderToFile(toW3C=False),username=controlInput["metadata"]["username"],runId=controlInput["metadata"]["runId"])

#injectProv(graph,SeismoPE)
ProvenancePE.PROV_PATH=os.environ['PROV_PATH']
ProvenancePE.BULK_SIZE=20
#injectProv(graph, (SeismoPE,), save_mode=ProvenancePE.SAVE_MODE_FILE,controlParameters={'username':controlInput["metadata"]["username"],'runId':controlInput["metadata"]["runId"],'outputdest':os.environ['EVENT_PATH']})

# to activate with the migration to the new provenance API
#profile_prov_run(graph,None,provImpClass=(SeismoPE,),save_mode=ProvenancePE.SAVE_MODE_FILE,username=os.environ['USER_NAME'],runId=os.environ['RUN_ID'],update=True,w3c_prov=False)



#for lcoal test with full provenance generation and upload to local repository
#Store via service

transfer_rules={"WavePlot_INGV": {
    "destination":"gsiftp://dir-irods.epcc.ed.ac.uk/~/<path>/",
    "rules":{
    "station": {
      "$eq": "IV"
    }
    }
  }
}

ProvenancePE.REPOS_URL='http://127.0.0.1:8082/workflowexecutions/insert'
rid='SIMUL_VERCE_'+getUniqueId()
profile_prov_run(graph,None,provImpClass=(SeismoPE,),transfer_rules=transfer_rules,save_mode='service',input=[{'test':'1','blah':'3'}],username="aspinuso",workflowId="173",description="test",system_id="xxxx",workflowName="simulation",runId=rid,w3c_prov=False)

