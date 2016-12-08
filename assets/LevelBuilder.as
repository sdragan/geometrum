package  {

	import flash.display.DisplayObject;
	import flash.display.DisplayObjectContainer;
	import flash.utils.getQualifiedClassName;
	
	public class LevelBuilder {
		
		private const LEVEL_HEIGHT: int = 720;
		private var count:int = 0;

		public function LevelBuilder(mc: DisplayObjectContainer) {
			buildLevel(mc);
		}
		
		public function buildLevel(mc: DisplayObjectContainer) {
//			trace("mc has " + mc.numChildren + " children");
			for (var i:int = 0; i < mc.numChildren; i++)
			{
				var child:DisplayObject = mc.getChildAt(i);
				var spriteName:String = getSpriteName(child);
				if (spriteName.length == 0)
				{
					continue;
				}
				var blockType:String = getBlockType(spriteName);
				var string:String = buildString(child.x, getY(child.y), child.rotation, spriteName, true, blockType);
				trace(string);
				updateCount(spriteName);
			}
			trace("gamefield.blocksLeft = " + count.toString() + ";")
		}		
		
		private function updateCount(spriteName: String):void
		{
			if (spriteName.indexOf("Unbreakable") < 0 && spriteName.indexOf("Dangerous") < 0)
			{
				count++;
			}			
		}

		private function buildString(objX:int, objY:int, objRotation:Number, spriteName:String, isStatic:Boolean, blockType:String):String
		{
			var output:String = "";
			output += "bodies.push(";
			output += "LevelObjectsFactory.addCrystal(";
			output += objX.toString() + ", ";
			output += objY.toString() + ", ";
			output += objRotation.toFixed(2) + ", ";
			output += "\"" + spriteName + "\", ";
			output += isStatic.toString() + ", ";
			output += blockType + ",";
			output += " space, container";
			if (spriteName.indexOf("Tough") >= 0)
			{
				output += ", [\"Block_Tough_1_hp2\",\"Block_Tough_1_hp1\"]";
			}
			else if (spriteName.indexOf("Magnet") >= 0)
			{
				output += ", [\"Block_Magnet_1_hp2\",\"Block_Magnet_1_hp1\"], areaContainer";
			}
			else if (spriteName.indexOf("Antimagnet") >= 0)
			{
				output += ", [\"Block_Antimagnet_1_hp2\",\"Block_Antimagnet_1_hp1\"], areaContainer";
			}
			else
			{
				output += "";
			}
			output += ")";
			output += ");";
			return output;
		}

        private function getSpriteName(child:DisplayObject):String
		{
			var result:String = getQualifiedClassName(child);
			if (result.indexOf("flash.display") == 0) {
				result = "";
			}
			return result;
		}

        private function getY(value:Number):int
		{
			return LEVEL_HEIGHT - value;
		}

        private function getBlockType(childName:String):String
		{
			if (childName.indexOf("Splittable") >= 0) return "[BlockTypes.SPLITTABLE]";
			else if (childName.indexOf("Tough") >= 0) return "[BlockTypes.TOUGH]";
			else if (childName.indexOf("Magnet") >= 0) return "[BlockTypes.MAGNET, BlockTypes.TOUGH]";
			else if (childName.indexOf("Antimagnet") >= 0) return "[BlockTypes.ANTIMAGNET, BlockTypes.TOUGH]";
			else if (childName.indexOf("Unbreakable") >= 0) return "[BlockTypes.UNBREAKABLE]";
			else if (childName.indexOf("Dangerous") >= 0) return "[BlockTypes.DANGEROUS]";
			return "[BlockTypes.NORMAL]";
		}

	}
	
}
