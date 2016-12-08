package
{

import flash.display.DisplayObject;
import flash.display.DisplayObjectContainer;
import flash.utils.getQualifiedClassName;
import flash.text.TextField;

public class SagamapBuilder
{
    private var mc:DisplayObjectContainer;
    private var nodesArray:Array;
    private var prevArray:Array;
    private const LEVEL_HEIGHT:int = 720;

    public function SagamapBuilder(mc:DisplayObjectContainer)
    {
        this.mc = mc;
        this.nodesArray = [];
        this.prevArray = [];
        buildSagamap();
    }

    private function buildSagamap()
    {
        for (var i:int = 0; i < mc.numChildren; i++)
        {
            var child:DisplayObject = mc.getChildAt(i);
            if (childIsLevelNode(child))
            {
                var levelNum:int = getLevelNum(child);
                var diameter:int = getLevelNodeDiameter(child);
                nodesArray[levelNum] = {x: child.x, y: getY(child.y), d: diameter};
                prevArray[levelNum] = getPrev(child);
            }
        }
        traceResult();
    }

    private function traceResult():void
    {
        var i:int;
        trace("levelNodePositions: [");
        for (i = 0; i < nodesArray.length; i++)
        {
            var info:Object = nodesArray[i];
            trace("{x: " + info.x + ", y: " + info.y + ", d: " + info.d + "},");
        }
        trace("]");

        trace("\n");

        var prevLevelsString:String = "prevLevels: [";
        for (i = 0; i < prevArray.length; i++)
        {
            if (i == 0 || prevArray[i - 1] != prevArray[i])
            {
                prevLevelsString += "\n" + prevArray[i];
            }
            else
            {
                prevLevelsString += " " + prevArray[i];
            }
            if (i < prevArray.length - 1)
            {
                prevLevelsString += ","
            }
        }
        prevLevelsString += "\n]";
        trace(prevLevelsString);
    }

    private function childIsLevelNode(child:DisplayObject):Boolean
    {
        return getQualifiedClassName(child).indexOf("LevelNodeCircle") >= 0;
    }

    private function childIsTextField(child:DisplayObject):Boolean
    {
        return getQualifiedClassName(child).indexOf("TextField") >= 0;
    }

    private function getCorrespondingLevelNumTextField(levelNode:DisplayObject):TextField
    {
        for (var i:int = 0; i < mc.numChildren; i++)
        {
            var child:DisplayObject = mc.getChildAt(i);
            if (childIsTextField(child) && levelNode.hitTestObject(child) && TextField(child).text.indexOf("prev") < 0)
            {
                return child as TextField;
            }
        }
        return null;
    }

    private function getCorrespondingPrevTextField(levelNode:DisplayObject):TextField
    {
        for (var i:int = 0; i < mc.numChildren; i++)
        {
            var child:DisplayObject = mc.getChildAt(i);
            if (childIsTextField(child) && levelNode.hitTestObject(child) && TextField(child).text.indexOf("prev") >= 0)
            {
                return child as TextField;
            }
        }
        return null;
    }

    private function getLevelNum(levelNode:DisplayObject):int
    {
        var correspondingTextField:TextField = getCorrespondingLevelNumTextField(levelNode);
        if (correspondingTextField != null)
        {
            return int(correspondingTextField.text);
        }
//        trace("Couldn't find the level textfield for levelnode");
        return 0;
    }

    private function getPrev(levelNode:DisplayObject):String
    {
        var correspondingTextField:TextField = getCorrespondingPrevTextField(levelNode);
        if (correspondingTextField != null)
        {
            return correspondingTextField.text.substr(6);
        }

//        trace("Couldn't find the prev textfield for levelnode");
        return "[]";
    }

    private function getLevelNodeDiameter(child:DisplayObject):int
    {
        var className:String = getQualifiedClassName(child);
        if (className.indexOf("76") >= 0)
        {
            return 76;
        }
        else if (className.indexOf("100") >= 0)
        {
            return 100;
        }
        else if (className.indexOf("150") >= 0)
        {
            return 150;
        }
        trace("Couldn't detect node diameter");
        return 0;
    }

    private function getY(value:Number):int
    {
        return LEVEL_HEIGHT - value;
    }
}
}