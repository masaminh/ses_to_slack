import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as NotifyHorseEntry from '../lib/notify_horse_entry-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new NotifyHorseEntry.NotifyHorseEntryStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
